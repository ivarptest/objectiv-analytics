import json
from datetime import datetime

import flask
import time

from typing import List, Dict

from flask import Response, Request

from objectiv_backend.common.config import get_collector_config
from objectiv_backend.common.types import EventData, EventDataList, EventList
from objectiv_backend.common.db import get_db_connection
from objectiv_backend.common.event_utils import add_global_context_to_event, get_contexts
from objectiv_backend.end_points.common import get_json_response, get_cookie_id
from objectiv_backend.end_points.extra_output import events_to_json, write_data_to_fs_if_configured, \
    write_data_to_s3_if_configured, write_data_to_snowplow_if_configured
from objectiv_backend.schema.validate_events import validate_structure_event_list, EventError
from objectiv_backend.workers.pg_queues import PostgresQueues, ProcessingStage
from objectiv_backend.workers.pg_storage import insert_events_into_nok_data
from objectiv_backend.workers.worker_entry import process_events_entry
from objectiv_backend.workers.worker_finalize import insert_events_into_data

from objectiv_backend.schema.schema import HttpContext, CookieIdContext

# Some limits on the inputs we accept
DATA_MAX_SIZE_BYTES = 1_000_000
DATA_MAX_EVENT_COUNT = 1_000


def collect() -> Response:
    """
    Endpoint that accepts event data from the tracker and stores it for further processing.
    """
    current_millis = round(time.time() * 1000)
    try:
        event_data: EventList = _get_event_data(flask.request)
        events: EventDataList = event_data['events']
        transport_time: int = event_data['transport_time']
    except ValueError as exc:
        print(f'Data problem: {exc}')  # todo: real error logging
        return _get_collector_response(error_count=1, event_count=-1, data_error=exc.__str__())

    # Do all the enrichment steps that can only be done in this phase
    add_http_contexts(events)
    add_cookie_id_contexts(events)

    set_time_in_events(events, current_millis, transport_time)

    if not get_collector_config().async_mode:
        ok_events, nok_events, event_errors = process_events_entry(events=events, current_millis=current_millis)
        print(f'ok_events: {len(ok_events)}, nok_events: {len(nok_events)}')
        write_sync_events(ok_events=ok_events, nok_events=nok_events)
        return _get_collector_response(error_count=len(nok_events), event_count=len(events), event_errors=event_errors)
    else:
        write_async_events(events=events)
        return _get_collector_response(error_count=0, event_count=len(events))


def _get_event_data(request: Request) -> EventList:
    """
    Parse the requests data as json and return as a list

    :raise ValueError:
        1) the data structure is bigger than DATA_MAX_SIZE_BYTES
        2) the data could not be parsed as JSON
        3) the parsed data isn't a valid dictionary
        4) the key 'events' could not be found in the dictionary
        5) event_data['events'] is not a list
        6) there are more than DATA_MAX_EVENT_COUNT events in the event list
        7) the structure did not validate as a valid EventList (validate_structure_event_list()

    :param request: Request from which to parse the data
    :return: the parsed data, an EventList (structure as sent by the tracker)
    """
    post_data = request.data
    if len(post_data) > DATA_MAX_SIZE_BYTES:
        # if it's more than a megabyte, we'll refuse to process
        raise ValueError(f'Data size exceeds limit')
    event_data: EventList = json.loads(post_data)
    if not isinstance(event_data, dict):
        raise ValueError('Parsed post data is not a dict')
    if 'events' not in event_data:
        raise ValueError('Could not find events key in event_data')
    if not isinstance(event_data['events'], list):
        raise ValueError('events is not a list')
    if len(event_data['events']) > DATA_MAX_EVENT_COUNT:
        raise ValueError('Events exceeds limit')
    error_info = validate_structure_event_list(event_data=event_data)
    if error_info:
        raise ValueError(f'List of Events not structured well: {error_info[0].info}')

    return event_data


def _get_collector_response(
        error_count: int, event_count: int, event_errors: List[EventError] = None, data_error: str = '') -> Response:
    """
    Create a Response object, with a json message with event counts, and a cookie set if needed.
    """

    if not get_collector_config().error_reporting:
        event_errors = []
        data_error = ''
    else:
        if event_errors is None:
            event_errors = []

    status = 200 if error_count == 0 else 400
    msg = json.dumps({
        "status": f"{status}",
        "error_count": error_count,
        "event_count": event_count,
        "event_errors": event_errors,
        "data_error": data_error
    })
    # we always return a HTTP 200 status code, so we can handle any errors
    # on the application layer.
    return get_json_response(status=200, msg=msg)


def add_http_contexts(events: EventDataList):
    """
    Modify the given list of events: Add or enrich the HttpContext to each event
    """
    for event in events:
        add_http_context_to_event(event=event, request=flask.request)


def add_cookie_id_contexts(events: EventDataList):
    """
    Modify the given list of events: Add the CookieIdContext to each event, if cookies are enabled.
    """
    cookie_config = get_collector_config().cookie
    if not cookie_config:
        return
    cookie_id = get_cookie_id()
    cookie_id_context = CookieIdContext(id=cookie_id, cookie_id=cookie_id)
    for event in events:
        add_global_context_to_event(event, cookie_id_context)


def set_time_in_events(events: EventDataList, current_millis: int, client_millis: int):
    """
    Modify the given list of events: Set the correct time in the events

    We use the `http x-transport-time` header to determine an offset (if any) between client and server time. We
    then correct `event.time` using this offset and set it in `event.time`
    :param events: List of events to modify
    :param current_millis: time in milliseconds since epoch UTC, when this request was received.
    :param client_millis: time sent by client
    """

    if not client_millis:
        client_millis = current_millis

    offset = current_millis - client_millis
    print(f'debug - time offset: {offset}')
    for event in events:
        # here we correct the tracking time with the calculated offset
        # the assumption here is that transport time should be the same as the server time (current_millis)
        # to account for clients that have an out-of-sync clock
        event['time'] = event['time'] + offset


def _get_remote_address(request: Request) -> str:
    """
    try to determine the IP address of the calling user agent, by looking at some standard headers
    if they aren't set, we fall back to 'remote_addr', which is the connecting client. In most
    cases this is probably wrong.
    :param request: original http request
    :return: string with ip address
    """

    x_forwarded_hosts = str(request.headers.get('X-Forwarded-For', '')).split()
    if 'X-Real-IP' in request.headers:
        # any upstream proxy probably know the 'right' IP. If it sets the x-real-ip header to that,
        # we use that.
        return request.headers['X-Real-IP']
    elif x_forwarded_hosts:
        # x-forwarded-for headers take the form of:
        # client proxy_1...proxy_n
        # we're interested in proxy_n, which is the last node that connects to us, and as such
        # has to be an Internet routed proxy. proxies before it, including the client may be internal
        # and non-routable addresses.
        return x_forwarded_hosts[-1]
    elif request.remote_addr:
        # if all else fails, look for remote_addr in the request. This is the IP the current connection
        # originates from. Most likely a proxy (which is why this is the last resort).
        return request.remote_addr

    # this should never happen!
    return 'unknown'


def add_http_context_to_event(event: EventData, request: Request):
    """
        Create or enrich an HttpContext based on the data in the current request. If an HttpContext is already
        present, the remote address is added to the existing context. Otherwise, a new context is created and
        added to the global_contexts[] of the provided event.

        :param event - event to add context to
        :param request - request object, used to extract extra context from.
    """

    remote_address = _get_remote_address(request)

    # check if there is a pre-existing http_context
    # if so, use that.
    contexts = get_contexts(event, 'HttpContext')
    if contexts:
        tracker_http_context = contexts[0]
        tracker_http_context['remote_address'] = remote_address
    else:
        # if a pre-existing context cannot be found, we create one from scratch
        http_context = {
            'id': 'http_context',
            'remote_address': remote_address,
            'referrer': request.headers.get('Referer', ''),
            'user_agent': request.headers.get('User-Agent', '')
        }

        add_global_context_to_event(event, HttpContext(**http_context))


def write_sync_events(ok_events: EventDataList, nok_events: EventDataList):
    """
    Write the events to the following sinks, if configured:
        * postgres
        * aws
        * file system
    """
    output_config = get_collector_config().output
    # todo: add exception handling. if one output fails, continue to next if configured.
    if output_config.postgres:
        connection = get_db_connection(output_config.postgres)
        try:
            with connection:
                insert_events_into_data(connection, events=ok_events)
                insert_events_into_nok_data(connection, events=nok_events)
        finally:
            connection.close()

    for prefix, events in ('OK', ok_events), ('NOK', nok_events):
        if events:
            data = events_to_json(events)
            moment = datetime.utcnow()
            write_data_to_snowplow_if_configured(events=events)
            if not output_config.file_system and not output_config.aws:
                return

            write_data_to_fs_if_configured(data=data, prefix=prefix, moment=moment)
            write_data_to_s3_if_configured(data=data, prefix=prefix, moment=moment)


def write_async_events(events: EventDataList):
    """
    Write the events to the following sinks, if configured:
        * postgres - To the entry queue
        * aws - to the 'RAW' prefix
        * file system - to the 'RAW' directory
    """
    output_config = get_collector_config().output
    # todo: add exception handling. if one output fails, continue to next if configured.
    if output_config.postgres:
        connection = get_db_connection(output_config.postgres)
        try:
            with connection:
                pg_queue = PostgresQueues(connection=connection)
                pg_queue.put_events(queue=ProcessingStage.ENTRY, events=events)
        finally:
            connection.close()

    prefix = 'RAW'
    if events:
        data = events_to_json(events)
        moment = datetime.utcnow()

        if not output_config.file_system and not output_config.aws:
            return
        write_data_to_fs_if_configured(data=data, prefix=prefix, moment=moment)
        write_data_to_s3_if_configured(data=data, prefix=prefix, moment=moment)


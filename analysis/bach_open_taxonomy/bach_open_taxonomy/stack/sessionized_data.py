"""
Copyright 2021 Objectiv B.V.
"""
from sql_models.model import SqlModelBuilder


class SessionizedData(SqlModelBuilder):

    @property
    def sql(self):
        return _SQL


_SQL = \
    '''
    with session_starts_{{id}} as (
        select
            cookie_id as cookie_id,
            event_id as event_id,
            coalesce(
                extract(
                    epoch from (moment - lag(moment, 1)
                        over (partition by cookie_id order by moment, event_id))
                ) > {session_gap_seconds},
                true
            ) as is_start_of_session,
            moment as moment
        from {{extracted_contexts}}
    ),
    session_id_and_start_{{id}} as (
        select
               -- TODO: do something smart so this can scale.
               -- currently we always have to query all data. We want to have consistent session_ids,
               -- but don't want to calculate them from scratch every time.
               -- uuid_generate_v1() as session_id,
               row_number() over (order by moment asc) as session_id,
               cookie_id,
               event_id,
               moment as moment
        from session_starts_{{id}}
        where is_start_of_session
    )
    select
            s.session_id as session_id,
            row_number() over (partition by s.session_id order by d.moment, d.event_id asc)
                as session_hit_number,
            d.cookie_id as user_id,
            d.*
    from {{extracted_contexts}} as d
    inner join session_id_and_start_{{id}} as s on s.cookie_id = d.cookie_id and s.moment <= d.moment
    where not exists (
        select *
        from session_id_and_start_{{id}} as s2
        where
          -- a session start for the same cookie
              s2.cookie_id = d.cookie_id
          and s2.moment <= d.moment
          -- and that session is closer to pq.moment than the selected session s
          and s2.moment > s.moment
    )
    order by session_id, moment
    '''

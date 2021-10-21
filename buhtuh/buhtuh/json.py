"""
Copyright 2021 Objectiv B.V.
"""
from typing import Union

from buhtuh.expression import Expression


class Json:
    def __init__(self, series_object):
        self._series_object = series_object

    # todo use expression instead of self._series_object.name
    def __getitem__(self, key: Union[int, slice]):
        if isinstance(key, int):
            return self._series_object._get_derived_series(
                'jsonb',
                Expression.construct(f'{{}}->{key}', self._series_object)
            )
        if isinstance(key, slice):
            expression_references = 0
            if key.step:
                raise NotImplementedError('slice steps not supported')
            if key.stop is not None:
                negative_stop = ''
                if isinstance(key.stop, int):
                    if key.stop < 0:
                        negative_stop = f'jsonb_array_length({{}})'
                        expression_references += 1
                    stop = f'{negative_stop} {key.stop} - 1'
                elif isinstance(key.stop, (dict, str)):
                    import json
                    key_stop = json.dumps(key.stop)
                    key_stop = key_stop.replace("'", "''")
                    stop = f"""(select min(case when ('{key_stop}'::jsonb) <@ value then ordinality end) -1
                    from jsonb_array_elements({{}}) with ordinality)"""
                    expression_references += 1
                else:
                    TypeError('cant')
            if key.start is not None:
                if isinstance(key.start, int):
                    negative_start = ''
                    if key.start < 0:
                        negative_start = f'jsonb_array_length({{}})'
                        expression_references += 1
                    start = f'{negative_start} {key.start}'
                elif isinstance(key.start, (dict, str)):
                    import json
                    key_start = json.dumps(key.start)
                    key_start = key_start.replace("'", "''")
                    start = f"""(select min(case when ('{key_start}'::jsonb) <@ value then ordinality end) -1
                    from jsonb_array_elements({{}}) with ordinality)"""
                    expression_references += 1
                else:
                    TypeError('cant')
                if key.stop is not None:
                    where = f'between {start} and {stop}'
                else:
                    where = f'>= {start}'
            else:
                where = f'<= {stop}'
            combined_expression = f"""(select jsonb_agg(x.value)
            from jsonb_array_elements({{}}) with ordinality x
            where ordinality - 1 {where})"""
            expression_references += 1
            return self._series_object._get_derived_series(
                'jsonb',
                Expression.construct(
                    combined_expression,
                    *([self._series_object] * expression_references)
                ))
        TypeError(f'key should be int or slice, actual type: {type(key)}')

    def get_value(self, key: str, as_str=False):
        '''
        as_str: if True, it returns a string, else json
        '''
        return_as_string_operator = ''
        return_dtype = 'json'
        if as_str:
            return_as_string_operator = '>'
            return_dtype = 'string'
        expression = Expression.construct(f"{{}}->{return_as_string_operator}'{key}'", self._series_object)
        return self._series_object._get_derived_series(return_dtype, expression)

    # objectiv features below:
    @property
    def cookie_id(self):
        expression = Expression.construct(
            f"""(select (array_agg(value->>'cookie_id'))[1]
            from jsonb_array_elements({{}})
            where value ->> '_type' = 'CookieIdContext')""",
            self._series_object
        )
        return self._series_object._get_derived_series('string', expression)

    @property
    def user_agent(self):
        expression = Expression.construct(
            f"""(select (array_agg(value->>'user_agent'))[1]
            from jsonb_array_elements({{}})
            where value ->> '_type' = 'HttpContext')""",
            self._series_object
        )
        return self._series_object._get_derived_series('string', expression)

    @property
    def nice_name(self):
        expression = Expression.construct(
            f"""(
            select array_to_string(
                array_agg(
                    replace(
                        regexp_replace(value ->> '_type', '([a-z])([A-Z])', '\\1 \\2', 'g'),
                    ' Context', '') || ': ' || (value ->> 'id')
                ),
            ' => ')
            from jsonb_array_elements({{}}) with ordinality
            where ordinality = jsonb_array_length({{}})) || case
                when jsonb_array_length({{}}) > 1
                    then ' located at ' || (select array_to_string(
                array_agg(
                    replace(
                        regexp_replace(value ->> '_type', '([a-z])([A-Z])', '\\1 \\2', 'g'),
                    ' Context', '') || ': ' || (value ->> 'id')
                ),
            ' => ')
            from jsonb_array_elements({{}}) with ordinality
            where ordinality = jsonb_array_length({{}})
            ) else '' end""",
            self._series_object,
            self._series_object,
            self._series_object,
            self._series_object,
            self._series_object
        )
        return self._series_object._get_derived_series('string', expression)
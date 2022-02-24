"""
Copyright 2021 Objectiv B.V.
"""
from typing import TYPE_CHECKING
from sql_models.constants import NotSet, not_set
from bach.series import Series

if TYPE_CHECKING:
    from bach.series import SeriesBoolean, SeriesInt64

from typing import (
    List, Union
)
from bach.series import SeriesTimestamp


class Aggregate:
    """
    Models that return aggregated data in some form from the original ObjectivFrame.

    Methods in this class can be filtered with the filter parameter, which always takes SeriesBoolean. The
    ModelHub can also create specific commonly used filters with methods that return SeriesBoolean from
    :py:attr:`ModelHub.map`.
    """

    def __init__(self, df):
        self._df = df

    def _check_groupby(self,
                       groupby,
                       illegal_groupby: str = None
                       ):

        if self._df.group_by:
            raise ValueError("can't run model hub models on a grouped DataFrame, please use parameters "
                             "(ie groupby of the model")

        groupby_list = groupby if isinstance(groupby, list) else [groupby]
        groupby_list = [] if groupby is None else groupby_list

        if illegal_groupby:
            for key in groupby_list:
                key = self._df[key] if isinstance(key, str) else key
                if key.equals(self._df[illegal_groupby]):
                    raise ValueError(f'"{illegal_groupby}" is in groupby but is needed for aggregation: not '
                                     f'allowed to group on that')

        grouped_df = self._df.groupby(groupby_list)
        return grouped_df

    def _generic_aggregation(self, groupby, column, filter, name):
        df = self._check_groupby(groupby=groupby,
                                 illegal_groupby=column)
        if filter:
            df['_filter'] = filter
            if filter.expression.has_windowed_aggregate_function:
                df = df.materialize()
            df = df[df._filter]

            name += '_' + filter.name

        series = df[column].nunique()
        return series.copy_override(name=name)

    def unique_users(self,
                     filter: 'SeriesBoolean' = None,
                     groupby: Union[List[Union[str, Series]],
                                    str,
                                    Series,
                                    NotSet] = not_set) -> 'SeriesInt64':
        """
        Calculate the unique users in the ObjectivFrame.

        :param filter: the output of this model is only based on the rows for which the filter is True.
        :param groupby: sets the column(s) to group by.
            - if `not_set` it defaults to using :py:attr:`ObjectivFrame.model_hub.time_agg`.
            - if None it aggregates over all data.
        :returns: series with results.
        """
        groupby = [self._df.mh.time_agg()] if groupby is not_set else groupby

        return self._generic_aggregation(groupby=groupby,
                                         column='user_id',
                                         filter=filter,
                                         name='unique_users')

    def unique_sessions(self,
                        filter: 'SeriesBoolean' = None,
                        groupby: Union[List[Union[str, Series]],
                                       str,
                                       Series,
                                       NotSet] = not_set) -> 'SeriesInt64':
        """
        Calculate the unique sessions in the ObjectivFrame.

        :param filter: the output of this model is only based on the rows for which the filter is True.
        :param groupby: sets the column(s) to group by.
            - if `not_set` it defaults to using :py:attr:`ObjectivFrame.model_hub.time_agg`.
            - if None it aggregates over all data.
        :returns: series with results.
        """
        groupby = [self._df.mh.time_agg()] if groupby is not_set else groupby

        return self._generic_aggregation(groupby=groupby,
                                         column='session_id',
                                         filter=filter,
                                         name='unique_sessions')

    def session_duration(self,
                         groupby: Union[List[Union[str, Series]],
                                        str,
                                        Series,
                                        NotSet] = not_set) -> 'SeriesInt64':
        """
        Calculate the average duration of sessions.

        :param groupby: sets the column(s) to group by.
            - if `not_set` it defaults to using :py:attr:`ObjectivFrame.model_hub.time_agg`.
            - if None it aggregates over all data.
        :returns: series with results.
        """
        groupby = [self._df.mh.time_agg()] if groupby is not_set else groupby

        new_groupby = [] if groupby is None else groupby
        new_groupby = new_groupby if isinstance(groupby, list) else [groupby]

        new_groupby = new_groupby + [self._df.session_id.copy_override(name='_session_id')]  # type: ignore

        # todo fix if grouping is session_id

        gdf = self._check_groupby(groupby=new_groupby)
        session_duration = gdf.aggregate({'moment': ['min', 'max']})
        session_duration['session_duration'] = session_duration['moment_max']-session_duration['moment_min']
        # remove "bounces"
        session_duration = session_duration[(session_duration['session_duration'] > '0')]

        return session_duration.groupby(session_duration.index_columns[:-1]).session_duration.mean()

    def frequency(self):
        """
        Calculate a frequency table for the number users by number of sessions.

        :returns: series with results.
        """
        total_sessions_user = self._df.groupby(['user_id']).aggregate({'session_id': 'nunique'})
        frequency = total_sessions_user.groupby(['session_id_nunique']).aggregate({'user_id': 'nunique'})

        return frequency

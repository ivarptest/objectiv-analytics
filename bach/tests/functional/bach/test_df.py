"""
Copyright 2021 Objectiv B.V.
"""
import numpy as np
import pandas as pd
import pytest
from bach import DataFrame, SeriesBoolean
from tests.functional.bach.test_data_and_utils import get_bt_with_test_data, assert_equals_data, get_from_df


def test_basic():
    bt = get_bt_with_test_data()
    assert_equals_data(
        bt,
        expected_columns=[
            '_index_skating_order',  # index
            'skating_order', 'city', 'municipality', 'inhabitants', 'founding',  # data columns
        ],
        expected_data=[
            [1, 1, 'Ljouwert', 'Leeuwarden', 93485, 1285],
            [2, 2, 'Snits', 'Súdwest-Fryslân', 33520, 1456],
            [3, 3, 'Drylts', 'Súdwest-Fryslân', 3055, 1268]
        ]
    )


def test_del_item():
    bt = get_bt_with_test_data()

    del(bt['founding'])
    assert 'founding' not in bt.data.keys()
    with pytest.raises(KeyError):
        bt.founding

    with pytest.raises(KeyError):
        del(bt['non existing column'])


def test_drop_items():
    bt = get_bt_with_test_data()

    nbt = bt.drop(columns=['founding'])
    assert 'founding' not in nbt.data.keys()
    assert 'founding' in bt.data.keys()

    bt.founding
    with pytest.raises(KeyError):
        nbt.founding

    nbt = bt.drop(columns=['founding'], inplace=True)
    assert nbt is None
    assert 'founding' not in bt.data.keys()

    bt.drop(columns=['inhabitants', 'city'], inplace=True)
    assert 'inhabitants' not in bt.data.keys()
    assert 'city' not in bt.data.keys()

    with pytest.raises(KeyError):
        bt.drop(columns=['non existing column'])

    bt.drop(columns=['non existing column'], errors='ignore')


def test_combined_operations1():
    bt = get_bt_with_test_data(full_data_set=True)
    bt['x'] = bt['municipality'] + ' some string'
    bt['y'] = bt['skating_order'] + bt['skating_order']
    result_bt = bt.groupby('x')[['y']].count()
    assert_equals_data(
        result_bt,
        order_by='x',
        expected_columns=['x', 'y_count'],
        expected_data=[
            ['De Friese Meren some string', 1],
            ['Harlingen some string', 1],
            ['Leeuwarden some string', 1],
            ['Noardeast-Fryslân some string', 1],
            ['Súdwest-Fryslân some string', 6],
            ['Waadhoeke some string', 1],
        ]
    )

    result_bt['z'] = result_bt['y_count'] + 10
    result_bt['y_count'] = result_bt['y_count'] + (-1)
    assert_equals_data(
        result_bt,
        order_by='x',
        expected_columns=['x', 'y_count', 'z'],
        expected_data=[
            ['De Friese Meren some string', 0, 11],
            ['Harlingen some string', 0, 11],
            ['Leeuwarden some string', 0, 11],
            ['Noardeast-Fryslân some string', 0, 11],
            ['Súdwest-Fryslân some string', 5, 16],
            ['Waadhoeke some string', 0, 11],
        ]
    )
    assert result_bt.y_count == result_bt['y_count']


def test_boolean_indexing_same_node():
    bt = get_bt_with_test_data(full_data_set=True)
    bti = bt['founding'] < 1300
    assert isinstance(bti, SeriesBoolean)
    result_bt = bt[bti]
    assert isinstance(result_bt, DataFrame)
    assert_equals_data(
        result_bt,
        expected_columns=['_index_skating_order', 'skating_order', 'city', 'municipality', 'inhabitants',
                          'founding'],
        expected_data=[
            [1, 1, 'Ljouwert', 'Leeuwarden', 93485, 1285],
            [3, 3, 'Drylts', 'Súdwest-Fryslân', 3055, 1268],
            [5, 5, 'Starum', 'Súdwest-Fryslân', 960, 1061],
            [6, 6, 'Hylpen', 'Súdwest-Fryslân', 870, 1225],
            [9, 9, 'Harns', 'Harlingen', 14740, 1234],
            [11, 11, 'Dokkum', 'Noardeast-Fryslân', 12675, 1298]
        ]
    )


def test_round():
    pdf = pd.DataFrame(
        data={
            'a': [1.9, 3.0, 4.123, 6.425124, 2.00000000001, 2.1, np.nan, 7.],
            'b': [11.9, 32.0, 43.123, 64.425124, 25.00000000001, 6, np.nan, 78.],
            'c': ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
            'd': [1, 2, 3, 4, 5, 6, 7, 8],
        },
    )
    bt = get_from_df('test_round', pdf)

    for i in 0, 3, 5, 9:
        result = bt.round(i).sort_values(by=['c']).to_pandas()
        expected = pdf.round(i).sort_values(by='c')
        pd.testing.assert_frame_equal(expected, result, check_names=False)

        result2 = bt.round(decimals=i).sort_values(by=['c']).to_pandas()
        expected2 = pdf.round(decimals=i).sort_values(by='c')
        pd.testing.assert_frame_equal(expected2, result2, check_names=False)


def test_quantile() -> None:
    pdf = pd.DataFrame(
        data={
            'a': [1, 2, 3, 4, 5, 6, np.nan, 7.],
            'b': [11.9, 32.0, 43.123, 64.425124, 25.00000000001, 6, np.nan, 78.],
            'c': ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
        },
    )
    bt = get_from_df('test_quantile', pdf)
    quantiles = [[0.2, 0.4], 0.5, [0.25, 0.3, 0.5, 0.75, 0.86]]

    for q in quantiles:
        result = bt.quantile(q).sort_index()

        # pandas returns a series when calculating just 1 quantile
        result_values = result.to_numpy() if isinstance(q, list) else result.to_numpy()[0]
        expected = pdf.reset_index(drop=False).quantile(q)
        np.testing.assert_almost_equal(expected, result_values, decimal=4)


def test_quantile_no_numeric_columns() -> None:
    pdf = pd.DataFrame(
        data={
            'a': ['a', 'b', 'c', 'd'],
            'c': ['e', 'f', 'g', 'h'],
        },
    )
    bt = get_from_df('test_quantile', pdf)
    bt.reset_index(drop=True, inplace=True)

    with pytest.raises(ValueError, match=r'DataFrame has no series supporting'):
        bt.quantile()

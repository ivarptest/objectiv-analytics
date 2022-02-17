import numpy as np
from decimal import Decimal

import pytest
from psycopg2._range import NumericRange

from tests.functional.bach.test_data_and_utils import get_bt_with_test_data, assert_equals_data, \
    get_bt_with_railway_data


def test_value_counts_basic():
    bt = get_bt_with_test_data()['municipality']
    result = bt.value_counts()

    np.testing.assert_equal(
        bt.to_pandas().value_counts().to_numpy(),
        result.to_numpy(),
    )

    assert_equals_data(
        result.to_frame(),
        expected_columns=['municipality', 'value_counts'],
        expected_data=[
            ['Súdwest-Fryslân', 2],
            ['Leeuwarden', 1]
        ],
    )

    result_normalized = bt.value_counts(normalize=True)
    np.testing.assert_almost_equal(
        bt.to_pandas().value_counts(normalize=True).to_numpy(),
        result_normalized.to_numpy(),
        decimal=2,
    )
    assert_equals_data(
        result_normalized.to_frame(),
        expected_columns=['municipality', 'value_counts'],
        expected_data=[
            ['Súdwest-Fryslân', 2 / 3],
            ['Leeuwarden', 1 / 3]
        ],
    )


def test_value_counts_w_bins() -> None:
    bins = 4
    inhabitants = get_bt_with_test_data(full_data_set=True)['inhabitants']
    result = inhabitants.value_counts(bins=bins)
    np.testing.assert_equal(
        inhabitants.to_pandas().value_counts(bins=bins).to_numpy(),
        result.to_numpy(),
    )
    bounds_right = '(]'
    bin1 = NumericRange(Decimal('607.215'),  Decimal('23896.25'), bounds=bounds_right)
    bin2 = NumericRange(Decimal('23896.25'),  Decimal('47092.5'), bounds=bounds_right)
    bin3 = NumericRange(Decimal('47092.5'),  Decimal('70288.75'), bounds=bounds_right)
    bin4 = NumericRange(Decimal('70288.75'), Decimal('93485'), bounds=bounds_right)
    assert_equals_data(
        result.sort_index(),
        expected_columns=['range', 'value_counts'],
        expected_data=[
            [bin1, 9],
            [bin2, 1],
            [bin3, 0],
            [bin4, 1],
        ],
    )


def test_value_counts_w_groupby() -> None:
    bt = get_bt_with_railway_data()[['town', 'platforms', 'station_id']].reset_index(drop=True)
    result = bt.groupby(['town', 'platforms'])['station_id'].value_counts()
    assert_equals_data(
        result.to_frame().sort_index(),
        expected_columns=['town', 'platforms', 'station_id', 'value_counts'],
        expected_data=[
            ['Drylts', 1, 1, 1],
            ['It Hearrenfean', 1, 2, 1],
            ['It Hearrenfean', 2, 3, 1],
            ['Ljouwert', 1, 5, 1],
            ['Ljouwert', 4, 4, 1],
            ['Snits', 2, 6, 1],
            ['Snits', 2, 7, 1],
        ],
    )

    result_normalized = bt.groupby(['town', 'platforms'])['station_id'].value_counts(normalize=True)
    assert_equals_data(
        result_normalized.to_frame().sort_index(),
        expected_columns=['town', 'platforms', 'station_id', 'value_counts'],
        expected_data=[
            ['Drylts', 1, 1, 1 / 7],
            ['It Hearrenfean', 1, 2, 1 / 7],
            ['It Hearrenfean', 2, 3, 1 / 7],
            ['Ljouwert', 1, 5, 1 / 7],
            ['Ljouwert', 4, 4, 1 / 7],
            ['Snits', 2, 6, 1 / 7],
            ['Snits', 2, 7, 1 / 7],
        ],
    )


def test_bins_error() -> None:
    with pytest.raises(ValueError, match='Cannot calculate bins for non numeric series.'):
        get_bt_with_railway_data()['town'].value_counts(bins=4)

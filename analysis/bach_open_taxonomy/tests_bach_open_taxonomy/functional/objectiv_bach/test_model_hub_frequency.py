"""
Copyright 2021 Objectiv B.V.
"""

# Any import from from bach_open_taxonomy initializes all the types, do not remove
from bach_open_taxonomy import __version__
from tests_bach_open_taxonomy.functional.objectiv_bach.data_and_utils import get_objectiv_frame
from tests.functional.bach.test_data_and_utils import assert_equals_data


def test_frequency():
    df = get_objectiv_frame()
    s = df.model_hub.aggregate.frequency()

    assert_equals_data(
        s,
        expected_columns=['session_id_nunique', 'user_id_nunique'],
        expected_data=[
            [1, 1],
            [2, 3]
        ]
    )

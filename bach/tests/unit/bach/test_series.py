"""
Copyright 2021 Objectiv B.V.
"""
from bach import get_series_type_from_dtype
from bach.expression import Expression
from bach.partitioning import GroupBy
from tests.unit.bach.util import get_fake_df


def test_equals():
    left = get_fake_df(['a'], ['b', 'c'])
    right = get_fake_df(['a'], ['b', 'c'])
    result = left['b'].equals(left['b'])
    # assert result is a boolean (for e.g.  '==') this is not the case
    assert result is True
    assert left['b'].equals(left['b'])
    assert left['b'].equals(right['b'])
    assert not left['b'].equals(left['c'])
    assert not left['b'].equals(right['c'])

    left = get_fake_df(['a', 'x'], ['b', 'c'])
    right = get_fake_df(['a'], ['b', 'c'])
    assert left['b'].equals(left['b'])
    assert not left['b'].equals(right['b'])
    assert not left['b'].equals(left['c'])
    assert not left['b'].equals(right['c'])

    # different order in the index
    left = get_fake_df(['a', 'b'], ['c'])
    right = get_fake_df(['b', 'a'], ['c'])
    assert not left['c'].equals(right['c'])

    int_type = get_series_type_from_dtype('int64')
    float_type = get_series_type_from_dtype('float64')

    expr_test = Expression.construct('test')
    expr_other = Expression.construct('test::text')

    sleft = int_type(engine=None, base_node=None, index={}, name='test',
                     expression=expr_test, group_by=None)
    sright = int_type(engine=None, base_node=None, index={}, name='test',
                      expression=expr_test, group_by=None)
    assert sleft.equals(sright)

    # different expression
    sright = int_type(engine=None, base_node=None, index={}, name='test',
                      expression=expr_other, group_by=None)
    assert not sleft.equals(sright)

    # different name
    sright = int_type(engine=None, base_node=None, index={}, name='test_2',
                      expression=expr_test, group_by=None)
    assert not sleft.equals(sright)

    # different base_node
    sright = int_type(engine=None, base_node='test', index={}, name='test',
                      expression=expr_test, group_by=None)
    assert not sleft.equals(sright)

    # different engine
    sright = int_type(engine='test', base_node=None, index={}, name='test',
                      expression=expr_test, group_by=None)
    assert not sleft.equals(sright)

    # different type
    sright = float_type(engine=None, base_node=None, index={}, name='test',
                        expression=expr_test, group_by=None)
    assert not sleft.equals(sright)

    # different group_by
    sright = float_type(engine=None, base_node=None, index={}, name='test', expression=expr_test,
                        group_by=GroupBy(group_by_columns=[]))
    assert not sleft.equals(sright)

    # different sorting
    sright = float_type(engine=None, base_node=None, index={}, name='test', expression=expr_test,
                        sorted_ascending=True, group_by=None)
    assert not sleft.equals(sright)

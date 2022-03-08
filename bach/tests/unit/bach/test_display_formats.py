import builtins
from IPython import display
from _pytest.monkeypatch import MonkeyPatch

from bach.display_formats import display_sql_as_markdown
from tests.unit.bach.util import get_fake_df


def test_display_sql_as_markdown(monkeypatch: MonkeyPatch) -> None:
    df = get_fake_df(['a'], ['b', 'c'])
    expected_sql = 'select * from fake_table'
    displayed_calls = 0

    def mocked_view_sql() -> str:
        return expected_sql

    def mocked_display(markdown: display.Markdown) -> None:
        nonlocal displayed_calls
        displayed_calls += 1

        assert isinstance(markdown, display.Markdown)
        assert markdown.data == f"```sql\n{expected_sql}```"

    monkeypatch.setattr(df, 'view_sql', mocked_view_sql)
    monkeypatch.setattr(display, 'display', mocked_display)
    display_sql_as_markdown(df)
    assert displayed_calls == 1

    # verifying that mocked_display is actually being called instead of the real IPython.display.display
    display_sql_as_markdown(df)
    assert displayed_calls == 2

    # mock ipython import and verify mocked_display is not called
    def mocked_import_ipython(name, *args, **kwargs) -> None:
        if name == 'IPython.display':
            raise ModuleNotFoundError

    monkeypatch.setattr(builtins, '__import__', mocked_import_ipython)
    display_sql_as_markdown(df)
    assert displayed_calls == 2

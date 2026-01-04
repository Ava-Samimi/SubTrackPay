def list_tables(cur) -> set[str]:
    cur.execute(
        """
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema='public' AND table_type='BASE TABLE'
        """
    )
    return {r[0] for r in cur.fetchall()}


def find_table(cur, candidates: list[str]) -> str | None:
    existing = list_tables(cur)
    for name in candidates:
        if name in existing:
            return name
    return None


def get_table_columns(cur, table_name: str) -> set[str]:
    cur.execute(
        """
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema='public' AND table_name=%s
        """,
        (table_name,),
    )
    return {r[0] for r in cur.fetchall()}


def pick_col(cols: set[str], candidates: list[str]) -> str | None:
    for c in candidates:
        if c in cols:
            return c
    return None


def get_enum_labels_for_column(cur, table_name: str, column_name: str) -> list[str]:
    """
    If public.<table>.<column> is a Postgres enum type, return allowed labels, else [].
    """
    cur.execute(
        """
        SELECT t.typname
        FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_type t ON t.oid = a.atttypid
        WHERE n.nspname = 'public'
          AND c.relname = %s
          AND a.attname = %s
          AND t.typtype = 'e'
        """,
        (table_name, column_name),
    )
    row = cur.fetchone()
    if not row:
        return []

    enum_type = row[0]
    cur.execute(
        """
        SELECT e.enumlabel
        FROM pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = %s
        ORDER BY e.enumsortorder
        """,
        (enum_type,),
    )
    return [r[0] for r in cur.fetchall()]

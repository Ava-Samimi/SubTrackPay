import psycopg2
from psycopg2.extras import execute_values


def connect(db_url: str):
    return psycopg2.connect(db_url)


def insert_many(cur, table: str, rows: list[dict], returning_col: str | None = None) -> list:
    if not rows:
        return []

    cols = list(rows[0].keys())
    values = [[row[c] for c in cols] for row in rows]

    col_sql = ",".join(['"{}"'.format(c) for c in cols])
    sql = 'INSERT INTO "{}" ({}) VALUES %s'.format(table, col_sql)

    if returning_col:
        sql += ' RETURNING "{}"'.format(returning_col)

    execute_values(cur, sql, values)

    if returning_col:
        return [r[0] for r in cur.fetchall()]
    return []

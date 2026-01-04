from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
import calendar


def last_day_of_month(d: date) -> int:
    return calendar.monthrange(d.year, d.month)[1]


def effective_due_day(start_day: int, d: date) -> int:
    # If start_day is 31 but month has 30 days, treat due day as last day of month.
    return min(start_day, last_day_of_month(d))


def window_dates(today: date, days_ahead: int) -> list[date]:
    end = today + timedelta(days=days_ahead)
    out = []
    cur = today
    while cur <= end:
        out.append(cur)
        cur += timedelta(days=1)
    return out


@dataclass
class VerifySchema:
    sub_table: str
    cust_table: str | None
    pkg_table: str | None

    sub_pk: str | None
    sub_cust_fk: str
    sub_pkg_fk: str | None

    sub_cycle_col: str | None
    sub_status_col: str | None
    sub_start_col: str

    cust_pk: str | None
    cust_first: str | None
    cust_last: str | None
    cust_full: str | None
    cust_email: str | None

    pkg_pk: str | None
    pkg_name: str | None


@dataclass
class DueItem:
    sub_id: int | None
    cust_id: int | None
    pkg_id: int | None

    start_date: date
    cycle: str | None
    status: str | None
    pkg_name: str | None

    customer_label: str | None  # nice label if we can build one
    due_dates: list[date]       # 1+ dates in the window where a payment would be due


def _select_or_null(alias: str, table_alias: str, col: str | None, pg_type: str = "text") -> str:
    if col:
        return f'{table_alias}."{col}" AS {alias}'
    return f"NULL::{pg_type} AS {alias}"


def find_due_monthly_active_subs(
    cur,
    schema: VerifySchema,
    days_ahead: int = 7,
    today: date | None = None,
) -> list[DueItem]:
    """
    Returns MONTHLY + ACTIVE subscriptions whose "startDate day-of-month"
    is due within [today, today+days_ahead].

    IMPORTANT: This function does NOT print and does NOT insert anything.
    """
    if today is None:
        today = date.today()

    dates = window_dates(today, days_ahead)

    # --- stable SELECT list ---
    sub_start_expr = _select_or_null("sub_start", "s", schema.sub_start_col, pg_type="date")
    sub_id_expr = _select_or_null("sub_id", "s", schema.sub_pk, pg_type="int")
    cust_id_expr = _select_or_null("cust_id", "s", schema.sub_cust_fk, pg_type="int")
    pkg_id_expr = _select_or_null("pkg_id", "s", schema.sub_pkg_fk, pg_type="int")
    cycle_expr = _select_or_null("cycle", "s", schema.sub_cycle_col, pg_type="text")
    status_expr = _select_or_null("status", "s", schema.sub_status_col, pg_type="text")

    joins = []
    can_join_customer = bool(schema.cust_table and schema.cust_pk)
    can_join_package = bool(schema.pkg_table and schema.pkg_pk and schema.sub_pkg_fk)

    if can_join_customer:
        joins.append(
            f'LEFT JOIN "{schema.cust_table}" c ON c."{schema.cust_pk}" = s."{schema.sub_cust_fk}"'
        )

    if can_join_package:
        joins.append(
            f'LEFT JOIN "{schema.pkg_table}" p ON p."{schema.pkg_pk}" = s."{schema.sub_pkg_fk}"'
        )

    cust_full_expr = _select_or_null("cust_full", "c", schema.cust_full, "text") if can_join_customer else "NULL::text AS cust_full"
    cust_first_expr = _select_or_null("cust_first", "c", schema.cust_first, "text") if can_join_customer else "NULL::text AS cust_first"
    cust_last_expr = _select_or_null("cust_last", "c", schema.cust_last, "text") if can_join_customer else "NULL::text AS cust_last"
    cust_email_expr = _select_or_null("cust_email", "c", schema.cust_email, "text") if can_join_customer else "NULL::text AS cust_email"
    pkg_name_expr = _select_or_null("pkg_name", "p", schema.pkg_name, "text") if can_join_package else "NULL::text AS pkg_name"

    sql = f"""
        SELECT
          {sub_start_expr},
          {sub_id_expr},
          {cust_id_expr},
          {pkg_id_expr},
          {cycle_expr},
          {status_expr},
          {cust_full_expr},
          {cust_first_expr},
          {cust_last_expr},
          {cust_email_expr},
          {pkg_name_expr}
        FROM "{schema.sub_table}" s
        {" ".join(joins)}
    """

    cur.execute(sql)
    rows = cur.fetchall()

    out: list[DueItem] = []

    for r in rows:
        (
            sub_start,
            sub_id,
            cust_id,
            pkg_id,
            cycle,
            status,
            cust_full,
            cust_first,
            cust_last,
            cust_email,
            pkg_name,
        ) = r

        if sub_start is None:
            continue

        # Filter MONTHLY + ACTIVE (only if the columns exist)
        if schema.sub_cycle_col and str(cycle).upper() != "MONTHLY":
            continue
        if schema.sub_status_col and str(status).upper() != "ACTIVE":
            continue

        start_day = int(sub_start.day)

        due_dates = []
        for d in dates:
            if d.day == effective_due_day(start_day, d):
                due_dates.append(d)

        if not due_dates:
            continue

        customer_label = (
            cust_full
            or (" ".join([x for x in [cust_first, cust_last] if x]) if (cust_first or cust_last) else None)
            or cust_email
        )

        out.append(
            DueItem(
                sub_id=sub_id,
                cust_id=cust_id,
                pkg_id=pkg_id,
                start_date=sub_start,
                cycle=cycle,
                status=status,
                pkg_name=pkg_name,
                customer_label=customer_label,
                due_dates=due_dates,
            )
        )

    return out


def verify_due_next_days(cur, schema: VerifySchema, days_ahead: int = 7, today: date | None = None) -> None:
    """
    Optional console printer (you can stop calling this if you don't want listing).
    Kept for debugging, but not required for payments.
    """
    if today is None:
        today = date.today()

    items = find_due_monthly_active_subs(cur, schema, days_ahead=days_ahead, today=today)
    dates = window_dates(today, days_ahead)

    print(f"\n=== VERIFY: Monthly + Active subscriptions due in next {days_ahead} days ===")
    print("Today:", today.isoformat(), " Window:", dates[0].isoformat(), "→", dates[-1].isoformat())
    print("Matches:", len(items))

    for it in items:
        due_str = ", ".join(d.isoformat() for d in it.due_dates)
        who = it.customer_label or f"Customer#{it.cust_id}"
        print(f'- sub={it.sub_id} customer="{who}" pkg="{it.pkg_name}" startDate={it.start_date.isoformat()} due={due_str}')

    print("=== END VERIFY ===\n")

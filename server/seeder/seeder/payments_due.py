from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta

from .db import insert_many
from .schema import find_table, get_table_columns, pick_col, get_enum_labels_for_column, list_tables
from .verify_due import VerifySchema, find_due_monthly_active_subs, window_dates


@dataclass
class PaymentInsertSchema:
    PAY_T: str
    pay_cols: set[str]

    # required
    pay_sub_fk: str
    pay_due: str

    # optional
    pay_status: str | None
    pay_amount: str | None
    pay_period_start: str | None
    pay_period_end: str | None
    pay_paid_at: str | None


def detect_payment_schema(cur) -> PaymentInsertSchema:
    PAY_T = find_table(cur, ["Payment", "payment", "payments"])
    if not PAY_T:
        existing = sorted(list(list_tables(cur)))
        raise SystemExit(
            "Could not find Payment table in public schema.\n"
            f"Existing tables: {existing}"
        )

    pay_cols = get_table_columns(cur, PAY_T)

    pay_sub_fk = pick_col(pay_cols, ["subscriptionID", "subscriptionId", "subscription_id"])
    pay_due = pick_col(pay_cols, ["dueDate", "due_date"])
    if not pay_sub_fk or not pay_due:
        raise SystemExit(
            f'{PAY_T}: missing required columns. Need subscription FK + dueDate.\n'
            f"Detected sub_fk={pay_sub_fk}, due={pay_due}\n"
            f"Cols={sorted(list(pay_cols))}"
        )

    pay_status = pick_col(pay_cols, ["status"])
    pay_amount = pick_col(pay_cols, ["amountCents", "amount_cents", "amount", "price", "priceCents", "price_cents"])
    pay_period_start = pick_col(pay_cols, ["periodStart", "period_start"])
    pay_period_end = pick_col(pay_cols, ["periodEnd", "period_end"])
    pay_paid_at = pick_col(pay_cols, ["paidAt", "paid_at"])

    return PaymentInsertSchema(
        PAY_T=PAY_T,
        pay_cols=pay_cols,
        pay_sub_fk=pay_sub_fk,
        pay_due=pay_due,
        pay_status=pay_status,
        pay_amount=pay_amount,
        pay_period_start=pay_period_start,
        pay_period_end=pay_period_end,
        pay_paid_at=pay_paid_at,
    )


def insert_due_payments(
    cur,
    verify_schema: VerifySchema,
    *,
    days_ahead: int = 7,
    today: date | None = None,
    quiet: bool = False,
) -> int:
    """
    Uses verify_due.find_due_monthly_active_subs(...) as source of truth.
    Inserts Payment rows for each due date in the window.
    Skips duplicates (subscriptionID + dueDate).
    Returns number of inserted rows.
    """
    if today is None:
        today = date.today()

    pay = detect_payment_schema(cur)

    due_items = find_due_monthly_active_subs(cur, verify_schema, days_ahead=days_ahead, today=today)
    if not due_items:
        if not quiet:
            print("ℹ️  No due MONTHLY+ACTIVE subscriptions found for Payment insertion.")
        return 0

    # Choose a safe status value if Payment.status exists (enum-safe)
    status_value = None
    if pay.pay_status:
        labels = get_enum_labels_for_column(cur, pay.PAY_T, pay.pay_status)
        if labels:
            # prefer DUE
            status_value = next((x for x in labels if str(x).upper() == "DUE"), labels[0])
        else:
            status_value = "DUE"

    # Duplicate protection: fetch existing pairs within the date window once
    dates = window_dates(today, days_ahead)
    min_d, max_d = dates[0], dates[-1]

    cur.execute(
        f'''
        SELECT "{pay.pay_sub_fk}", "{pay.pay_due}"
        FROM "{pay.PAY_T}"
        WHERE "{pay.pay_due}" BETWEEN %s AND %s
        ''',
        (min_d, max_d),
    )
    existing_pairs = {(r[0], r[1]) for r in cur.fetchall()}

    new_rows: list[dict] = []

    for it in due_items:
        if it.sub_id is None:
            continue

        # Amount: if Payment has an amount column, we try to pull from Subscription.price
        # If your Subscription has price and you want to use it, add it to verify logic later.
        # For now: default 29 if needed.
        amount_value = 29 if pay.pay_amount else None

        for due_d in it.due_dates:
            if (it.sub_id, due_d) in existing_pairs:
                continue

            row = {
                pay.pay_sub_fk: it.sub_id,
                pay.pay_due: due_d,
            }

            if pay.pay_status:
                row[pay.pay_status] = status_value

            if pay.pay_amount:
                row[pay.pay_amount] = amount_value

            # Optional period columns (simple approximation for monthly billing)
            if pay.pay_period_start:
                row[pay.pay_period_start] = due_d - timedelta(days=30)
            if pay.pay_period_end:
                row[pay.pay_period_end] = due_d
            if pay.pay_paid_at:
                row[pay.pay_paid_at] = None

            new_rows.append(row)

    if not new_rows:
        if not quiet:
            print("ℹ️  No new Payment rows to insert (already exists for window).")
        return 0

    insert_many(cur, pay.PAY_T, new_rows, returning_col=None)

    if not quiet:
        print(f"✅ Inserted {len(new_rows)} Payment rows into {pay.PAY_T}.")
    return len(new_rows)

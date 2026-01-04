# server/seeder/seeder/seeders.py

import random

from .config import load_config
from .db import connect, insert_many
from .random_data import rand_first, rand_last, rand_email, rand_past_date
from .schema import (
    list_tables,
    find_table,
    get_table_columns,
    pick_col,
    get_enum_labels_for_column,
)
from .verify_due import VerifySchema
from .payments_due import insert_due_payments


class Schema:
    def __init__(self, CUSTOMER_T, PACKAGE_T, SUB_T, cust_cols, pkg_cols, sub_cols):
        self.CUSTOMER_T = CUSTOMER_T
        self.PACKAGE_T = PACKAGE_T
        self.SUB_T = SUB_T
        self.cust_cols = cust_cols
        self.pkg_cols = pkg_cols
        self.sub_cols = sub_cols


def detect_schema(cur) -> Schema:
    CUSTOMER_T = find_table(cur, ["Customer", "customer", "customers"])
    PACKAGE_T = find_table(cur, ["Package", "package", "packages"])
    SUB_T = find_table(cur, ["Subscription", "subscription", "subscriptions"])

    if not CUSTOMER_T or not PACKAGE_T or not SUB_T:
        existing = sorted(list(list_tables(cur)))
        raise SystemExit(
            "Could not find required tables in public schema.\n"
            f"Detected: Customer={CUSTOMER_T}, Package={PACKAGE_T}, Subscription={SUB_T}\n"
            f"Existing tables: {existing}"
        )

    cust_cols = get_table_columns(cur, CUSTOMER_T)
    pkg_cols = get_table_columns(cur, PACKAGE_T)
    sub_cols = get_table_columns(cur, SUB_T)

    return Schema(CUSTOMER_T, PACKAGE_T, SUB_T, cust_cols, pkg_cols, sub_cols)


def seed_guard(cur, customer_table: str) -> bool:
    cur.execute('SELECT COUNT(*) FROM "{}"'.format(customer_table))
    return cur.fetchone()[0] > 0


def seed_packages(cur, schema: Schema, n: int) -> tuple[list[int], dict[int, dict[str, int]]]:
    pkg_cols = schema.pkg_cols
    PACKAGE_T = schema.PACKAGE_T

    pkg_pk = pick_col(pkg_cols, ["id", "packageId", "packageID"])
    if not pkg_pk:
        raise SystemExit("Could not detect Package PK column.")

    pkg_name_col = pick_col(pkg_cols, ["name", "title", "packageName"])
    pkg_monthly_col = pick_col(pkg_cols, ["monthlyCost", "monthly_cost", "monthlyCents", "monthly_cents"])
    pkg_annual_col = pick_col(pkg_cols, ["annualCost", "annual_cost", "annualCents", "annual_cents"])

    package_rows = []
    for i in range(n):
        row = {}
        if pkg_name_col:
            row[pkg_name_col] = f"Package {i+1}"
        if pkg_monthly_col:
            row[pkg_monthly_col] = random.choice([19, 29, 39, 49, 59, 79, 99])
        if pkg_annual_col:
            row[pkg_annual_col] = random.choice([199, 299, 399, 499, 599, 799, 999])

        if not row:
            raise SystemExit(f'{PACKAGE_T}: no recognized columns to insert.')
        package_rows.append(row)

    pkg_ids = insert_many(cur, PACKAGE_T, package_rows, returning_col=pkg_pk)

    # Cost lookup for subscription pricing
    pkg_costs: dict[int, dict[str, int]] = {}
    if pkg_monthly_col or pkg_annual_col:
        select_cols = ['"{}"'.format(pkg_pk)]
        if pkg_monthly_col:
            select_cols.append('"{}"'.format(pkg_monthly_col))
        if pkg_annual_col:
            select_cols.append('"{}"'.format(pkg_annual_col))

        cur.execute('SELECT {} FROM "{}"'.format(",".join(select_cols), PACKAGE_T))
        for r in cur.fetchall():
            pid = r[0]
            idx = 1
            monthly = None
            annual = None
            if pkg_monthly_col:
                monthly = r[idx]
                idx += 1
            if pkg_annual_col:
                annual = r[idx] if idx < len(r) else None
            pkg_costs[pid] = {"MONTHLY": monthly, "ANNUAL": annual}

    return pkg_ids, pkg_costs


def seed_customers(cur, schema: Schema, n: int) -> list[int]:
    cust_cols = schema.cust_cols
    CUSTOMER_T = schema.CUSTOMER_T

    cust_pk = pick_col(cust_cols, ["id", "customerId", "customerID"])
    if not cust_pk:
        raise SystemExit("Could not detect Customer PK column.")

    cust_first_col = pick_col(cust_cols, ["firstName", "first_name"])
    cust_last_col = pick_col(cust_cols, ["lastName", "last_name"])
    cust_full_col = pick_col(cust_cols, ["fullName", "name", "customerName"])
    cust_email_col = pick_col(cust_cols, ["email", "emailAddress"])
    cust_since_col = pick_col(cust_cols, ["memberSince", "member_since", "createdAt", "created_at"])

    customer_rows = []
    for _ in range(n):
        first = rand_first()
        last = rand_last()
        full = f"{first} {last}"

        row = {}
        if cust_first_col:
            row[cust_first_col] = first
        if cust_last_col:
            row[cust_last_col] = last
        if cust_full_col:
            row[cust_full_col] = full
        if cust_email_col:
            row[cust_email_col] = rand_email(first, last)
        if cust_since_col:
            row[cust_since_col] = rand_past_date()

        if not row:
            raise SystemExit(f'{CUSTOMER_T}: no recognized columns to insert.')
        customer_rows.append(row)

    return insert_many(cur, CUSTOMER_T, customer_rows, returning_col=cust_pk)


def seed_subscriptions(
    cur,
    schema: Schema,
    n: int,
    cust_ids: list[int],
    pkg_ids: list[int],
    pkg_costs: dict[int, dict[str, int]],
):
    sub_cols = schema.sub_cols
    SUB_T = schema.SUB_T

    sub_cust_fk = pick_col(sub_cols, ["customerID", "customerId", "customer_id"])
    sub_pkg_fk = pick_col(sub_cols, ["packageID", "packageId", "package_id"])
    if not sub_cust_fk or not sub_pkg_fk:
        raise SystemExit(f"Could not detect Subscription FK columns. Cols={sorted(list(sub_cols))}")

    sub_cycle_col = pick_col(sub_cols, ["billingCycle", "billing_cycle", "cycle"])
    sub_start_col = pick_col(sub_cols, ["startDate", "start_date", "createdAt", "created_at"])
    sub_status_col = pick_col(sub_cols, ["status", "state"])
    sub_price_col = pick_col(sub_cols, ["price", "amount", "amountCents", "amount_cents", "priceCents", "price_cents"])

    allowed_statuses = get_enum_labels_for_column(cur, SUB_T, sub_status_col) if sub_status_col else []

    if not sub_start_col:
        raise SystemExit(
            f'{SUB_T}: could not find a start date column (startDate/createdAt). '
            f"Cols={sorted(list(sub_cols))}"
        )

    sub_rows = []
    for _ in range(n):
        cust_id = random.choice(cust_ids)
        pkg_id = random.choice(pkg_ids)

        cycle = "MONTHLY"
        if sub_cycle_col:
            cycle = random.choice(["MONTHLY", "ANNUAL"])

        row = {sub_cust_fk: cust_id, sub_pkg_fk: pkg_id}

        if sub_cycle_col:
            row[sub_cycle_col] = cycle
        row[sub_start_col] = rand_past_date(1200)

        if sub_status_col:
            row[sub_status_col] = random.choice(allowed_statuses) if allowed_statuses else "ACTIVE"

        # Price (required in some schemas)
        if sub_price_col:
            price = None
            if pkg_id in pkg_costs:
                price = pkg_costs[pkg_id].get(cycle)
            if price is None:
                price = 29 if cycle == "MONTHLY" else 299
            row[sub_price_col] = price

        sub_rows.append(row)

    insert_many(cur, SUB_T, sub_rows, returning_col=None)


def run_payments_after_seed(cur, schema: Schema):
    """
    Create Payment rows for:
      - MONTHLY
      - ACTIVE
      - due within next 7 days (based on startDate day-of-month)

    Source of truth = verify_due.find_due_monthly_active_subs(...)
    No console listing of subscriptions; only a short insert summary.
    """
    vs = VerifySchema(
        sub_table=schema.SUB_T,
        cust_table=schema.CUSTOMER_T,
        pkg_table=schema.PACKAGE_T,
        sub_pk=pick_col(schema.sub_cols, ["id", "subscriptionId", "subscriptionID"]),
        sub_cust_fk=pick_col(schema.sub_cols, ["customerID", "customerId", "customer_id"]),
        sub_pkg_fk=pick_col(schema.sub_cols, ["packageID", "packageId", "package_id"]),
        sub_cycle_col=pick_col(schema.sub_cols, ["billingCycle", "billing_cycle", "cycle"]),
        sub_status_col=pick_col(schema.sub_cols, ["status", "state"]),
        sub_start_col=pick_col(schema.sub_cols, ["startDate", "start_date", "createdAt", "created_at"]),
        cust_pk=pick_col(schema.cust_cols, ["id", "customerId", "customerID"]),
        cust_first=pick_col(schema.cust_cols, ["firstName", "first_name"]),
        cust_last=pick_col(schema.cust_cols, ["lastName", "last_name"]),
        cust_full=pick_col(schema.cust_cols, ["fullName", "name", "customerName"]),
        cust_email=pick_col(schema.cust_cols, ["email", "emailAddress"]),
        pkg_pk=pick_col(schema.pkg_cols, ["id", "packageId", "packageID"]),
        pkg_name=pick_col(schema.pkg_cols, ["name", "title", "packageName"]),
    )

    if not vs.sub_cust_fk or not vs.sub_start_col:
        print("⚠️  Payment insert skipped: missing required Subscription columns for customer/startDate.")
        return

    insert_due_payments(cur, vs, days_ahead=7, quiet=False)


def run_seed():
    cfg = load_config()
    random.seed(cfg.seed_random_seed)

    conn = connect(cfg.db_url)
    try:
        with conn:
            with conn.cursor() as cur:
                schema = detect_schema(cur)

                # If skipping seed because customers already exist, still insert payments for upcoming dues
                if cfg.seed_skip_if_exists and seed_guard(cur, schema.CUSTOMER_T):
                    print(f"ℹ️  Seed skipped: {schema.CUSTOMER_T} already has rows.")
                    run_payments_after_seed(cur, schema)
                    return

                pkg_ids, pkg_costs = seed_packages(cur, schema, cfg.seed_packages)
                cust_ids = seed_customers(cur, schema, cfg.seed_customers)
                seed_subscriptions(cur, schema, cfg.seed_subscriptions, cust_ids, pkg_ids, pkg_costs)

                print("✅ Seed complete:")
                print(f"  Tables: {schema.CUSTOMER_T}, {schema.PACKAGE_T}, {schema.SUB_T}")
                print(f"  Packages: {cfg.seed_packages}")
                print(f"  Customers: {cfg.seed_customers}")
                print(f"  Subscriptions: {cfg.seed_subscriptions}")

                # ✅ After seed: insert due payments
                run_payments_after_seed(cur, schema)

    finally:
        conn.close()

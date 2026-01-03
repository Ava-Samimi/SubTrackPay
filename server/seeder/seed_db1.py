import os
import random
import string
from datetime import date, timedelta
from urllib.parse import urlparse, urlunparse

import psycopg2
from psycopg2.extras import execute_values


FIRST_NAMES = ["Alex", "Sam", "Jordan", "Taylor", "Chris", "Morgan", "Jamie", "Casey", "Riley", "Avery"]
LAST_NAMES = ["Smith", "Johnson", "Brown", "Davis", "Miller", "Wilson", "Moore", "Clark", "Lewis", "Young"]


def rand_first() -> str:
    return random.choice(FIRST_NAMES)


def rand_last() -> str:
    return random.choice(LAST_NAMES)


def rand_email(first: str, last: str) -> str:
    base = f"{first}{last}".lower()
    base = "".join(ch for ch in base if ch.isalnum())
    suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=5))
    return f"{base}.{suffix}@example.com"


def rand_past_date(max_days_back: int = 3650) -> date:
    return date.today() - timedelta(days=random.randint(0, max_days_back))


def strip_prisma_schema_query(url: str) -> str:
    if "?" in url and "schema=" in url:
        p = urlparse(url)
        return urlunparse((p.scheme, p.netloc, p.path, p.params, "", p.fragment))
    return url


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


def get_enum_labels_for_column(cur, table_name: str, column_name: str) -> list[str]:
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


def main():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        raise SystemExit("Missing DATABASE_URL env var.")
    db_url = strip_prisma_schema_query(db_url)

    seed_customers = int(os.environ.get("SEED_CUSTOMERS", "500"))
    seed_packages = int(os.environ.get("SEED_PACKAGES", "5"))
    seed_subs = int(os.environ.get("SEED_SUBSCRIPTIONS", "500"))
    seed_rng = int(os.environ.get("SEED_RANDOM_SEED", "42"))
    seed_skip_if_exists = os.environ.get("SEED_SKIP_IF_EXISTS", "1").strip() not in ("0", "false", "False")

    random.seed(seed_rng)

    conn = psycopg2.connect(db_url)

    try:
        with conn:
            with conn.cursor() as cur:
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

                # PK columns
                cust_pk = pick_col(cust_cols, ["id", "customerId", "customerID"])
                pkg_pk = pick_col(pkg_cols, ["id", "packageId", "packageID"])
                if not cust_pk or not pkg_pk:
                    raise SystemExit("Could not detect PK columns for Customer or Package.")

                # Customer fields
                cust_first_col = pick_col(cust_cols, ["firstName", "first_name"])
                cust_last_col = pick_col(cust_cols, ["lastName", "last_name"])
                cust_full_col = pick_col(cust_cols, ["fullName", "name", "customerName"])
                cust_email_col = pick_col(cust_cols, ["email", "emailAddress"])
                cust_since_col = pick_col(cust_cols, ["memberSince", "member_since", "createdAt", "created_at"])

                # Package fields (we’ll also read these for Subscription.price)
                pkg_name_col = pick_col(pkg_cols, ["name", "title", "packageName"])
                pkg_monthly_col = pick_col(pkg_cols, ["monthlyCost", "monthly_cost", "monthlyCents", "monthly_cents"])
                pkg_annual_col = pick_col(pkg_cols, ["annualCost", "annual_cost", "annualCents", "annual_cents"])

                # Subscription FK columns
                sub_cust_fk = pick_col(sub_cols, ["customerID", "customerId", "customer_id"])
                sub_pkg_fk = pick_col(sub_cols, ["packageID", "packageId", "package_id"])
                if not sub_cust_fk or not sub_pkg_fk:
                    raise SystemExit(f"Could not detect Subscription FK columns. Cols={sorted(list(sub_cols))}")

                # Optional subscription fields
                sub_cycle_col = pick_col(sub_cols, ["billingCycle", "billing_cycle", "cycle"])
                sub_start_col = pick_col(sub_cols, ["startDate", "start_date", "createdAt", "created_at"])
                sub_status_col = pick_col(sub_cols, ["status", "state"])

                # REQUIRED-ish subscription price fields
                # Your error says "price" is NOT NULL
                sub_price_col = pick_col(sub_cols, ["price", "amount", "amountCents", "amount_cents", "priceCents", "price_cents"])

                allowed_statuses = []
                if sub_status_col:
                    allowed_statuses = get_enum_labels_for_column(cur, SUB_T, sub_status_col)

                # Seed guard
                if seed_skip_if_exists:
                    cur.execute('SELECT COUNT(*) FROM "{}"'.format(CUSTOMER_T))
                    if cur.fetchone()[0] > 0:
                        print(f"ℹ️  Seed skipped: {CUSTOMER_T} already has rows.")
                        return

                # ----------------------------
                # 1) Packages
                # ----------------------------
                package_rows = []
                for i in range(seed_packages):
                    row = {}
                    if pkg_name_col:
                        row[pkg_name_col] = f"Package {i+1}"

                    # Ensure we have at least one cost column populated if it exists
                    if pkg_monthly_col:
                        row[pkg_monthly_col] = random.choice([19, 29, 39, 49, 59, 79, 99])
                    if pkg_annual_col:
                        row[pkg_annual_col] = random.choice([199, 299, 399, 499, 599, 799, 999])

                    if not row:
                        raise SystemExit(f"{PACKAGE_T}: no recognized columns to insert.")
                    package_rows.append(row)

                pkg_ids = insert_many(cur, PACKAGE_T, package_rows, returning_col=pkg_pk)

                # Build a lookup of package costs for subscription pricing
                # If monthly/annual columns don't exist, we’ll fallback to hardcoded prices.
                pkg_costs: dict[int, dict[str, int]] = {}
                if pkg_monthly_col or pkg_annual_col:
                    select_cols = ['"{}"'.format(pkg_pk)]
                    if pkg_monthly_col:
                        select_cols.append('"{}"'.format(pkg_monthly_col))
                    if pkg_annual_col:
                        select_cols.append('"{}"'.format(pkg_annual_col))

                    cur.execute('SELECT {} FROM "{}"'.format(",".join(select_cols), PACKAGE_T))
                    for row in cur.fetchall():
                        pid = row[0]
                        idx = 1
                        monthly = None
                        annual = None
                        if pkg_monthly_col:
                            monthly = row[idx]
                            idx += 1
                        if pkg_annual_col:
                            annual = row[idx] if idx < len(row) else None
                        pkg_costs[pid] = {"MONTHLY": monthly, "ANNUAL": annual}

                # ----------------------------
                # 2) Customers
                # ----------------------------
                customer_rows = []
                for _ in range(seed_customers):
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
                        raise SystemExit(f"{CUSTOMER_T}: no recognized columns to insert.")
                    customer_rows.append(row)

                cust_ids = insert_many(cur, CUSTOMER_T, customer_rows, returning_col=cust_pk)

                # ----------------------------
                # 3) Subscriptions (set price!)
                # ----------------------------
                sub_rows = []
                for _ in range(seed_subs):
                    cust_id = random.choice(cust_ids)
                    pkg_id = random.choice(pkg_ids)

                    cycle = "MONTHLY"
                    if sub_cycle_col:
                        cycle = random.choice(["MONTHLY", "ANNUAL"])

                    row = {
                        sub_cust_fk: cust_id,
                        sub_pkg_fk: pkg_id,
                    }

                    if sub_cycle_col:
                        row[sub_cycle_col] = cycle
                    if sub_start_col:
                        row[sub_start_col] = rand_past_date(1200)

                    if sub_status_col:
                        if allowed_statuses:
                            row[sub_status_col] = random.choice(allowed_statuses)
                        else:
                            row[sub_status_col] = "ACTIVE"

                    # PRICE: try to compute from package costs; fallback if missing
                    if sub_price_col:
                        price = None
                        if pkg_id in pkg_costs:
                            price = pkg_costs[pkg_id].get(cycle)

                        if price is None:
                            # fallback: reasonable defaults
                            price = 29 if cycle == "MONTHLY" else 299

                        row[sub_price_col] = price

                    sub_rows.append(row)

                insert_many(cur, SUB_T, sub_rows, returning_col=None)

                print("✅ Seed complete:")
                print(f"  Tables: {CUSTOMER_T}, {PACKAGE_T}, {SUB_T}")
                print(f"  Packages: {seed_packages}")
                print(f"  Customers: {seed_customers}")
                print(f"  Subscriptions: {seed_subs}")

    finally:
        conn.close()


if __name__ == "__main__":
    main()

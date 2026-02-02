import os
import sys
from dotenv import load_dotenv

# Load .env from project root (or adjust path)
load_dotenv()

# Ensure imports work: allow `from seeder.seeders import run_seed`
HERE = os.path.dirname(os.path.abspath(__file__))  # .../server/seeder
if HERE not in sys.path:
    sys.path.insert(0, HERE)

from seeder.db import connect
from seeder.seeders import run_seed


def truncate_all_tables(conn):
    """
    Truncates ALL tables in schema 'public' except Prisma's migration table.
    Keeps table structures, only deletes rows + resets identities.
    """
    with conn.cursor() as cur:
        # Build one TRUNCATE statement for all public tables except _prisma_migrations
        cur.execute("""
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
              AND tablename <> '_prisma_migrations';
        """)
        tables = [r[0] for r in cur.fetchall()]

        if not tables:
            print("ℹ️ No tables found to truncate.")
            return

        # Quote table names safely
        quoted = ', '.join([f'"{t}"' for t in tables])

        sql = f"TRUNCATE TABLE {quoted} RESTART IDENTITY CASCADE;"
        cur.execute(sql)
        print(f"✅ Truncated {len(tables)} tables.")


def main():
    # Must be the same DATABASE_URL your server uses
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise SystemExit("DATABASE_URL is not set (needed for reset_and_seed.py).")

    conn = connect(db_url)
    try:
        with conn:
            truncate_all_tables(conn)

        # Important: your run_seed() uses cfg.seed_skip_if_exists
        # but since we just truncated, it's empty, so it will seed normally.
        run_seed()

        print("✅ Reset + seed complete.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()

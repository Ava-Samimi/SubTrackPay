import json
import os
from pathlib import Path

# ✅ Option 2: fixed map for demo names
PACKAGE_NAME_BY_ID = {
    1: "Starter",
    2: "Basic",
    3: "Standard",
    4: "Pro",
    5: "Plus",
    6: "Business",
    7: "Premium",
    8: "Enterprise",
    9: "Student",
    10: "VIP",
}


def get_package_name(package_id: int | None) -> str | None:
    if package_id is None:
        return None
    return PACKAGE_NAME_BY_ID.get(int(package_id), f"Package #{int(package_id)}")


def generate_package_percentage_json(cur, output_file=None, top_n: int = 4):
    """
    Calculates percentage of each package in subscriptions and saves result as JSON.
    Only returns the top N packages by percentage (default: 4).

    Runtime output folder:
      - Uses DATA_DIR env var when provided (recommended in Docker)
      - Defaults to /app/data

    Args:
        cur: Database cursor.
        output_file (str|Path|None): If None, writes to DATA_DIR/package_percentages.json
        top_n (int): number of top packages to include (default 4)
    Returns:
        str: Path to the written JSON file.
    """
    data_dir = Path(os.getenv("DATA_DIR", "/app/data"))
    data_dir.mkdir(parents=True, exist_ok=True)

    if output_file is None:
        output_path = data_dir / "package_percentages.json"
    else:
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)

    # Query to get package counts (highest first)
    query = """
        SELECT p."packageID", p."monthlyCost", p."annualCost", COUNT(s."packageID") AS package_count
        FROM "Package" p
        LEFT JOIN "Subscription" s ON s."packageID" = p."packageID"
        GROUP BY p."packageID", p."monthlyCost", p."annualCost"
        ORDER BY package_count DESC;
    """
    cur.execute(query)
    package_data = cur.fetchall()

    # Total subscriptions
    cur.execute('SELECT COUNT(*) FROM "Subscription";')
    total_subscriptions = cur.fetchone()[0] or 0

    package_percentages = []
    for package_id, monthly_cost, annual_cost, package_count in package_data:
        percentage = 0.0 if total_subscriptions == 0 else (package_count / total_subscriptions) * 100.0
        package_id_int = int(package_id) if package_id is not None else None

        package_percentages.append(
            {
                "package_id": package_id_int,
                "package_name": get_package_name(package_id_int),
                "monthly_cost": float(monthly_cost) if monthly_cost is not None else None,
                "annual_cost": float(annual_cost) if annual_cost is not None else None,
                "percentage": round(float(percentage), 2),
            }
        )

    # ✅ Keep only top N
    top_n = max(0, int(top_n))
    package_percentages = package_percentages[:top_n]

    # Write JSON
    output_path.write_text(
        json.dumps(package_percentages, indent=2),
        encoding="utf-8",
    )

    print(f"Top {top_n} package percentage data has been saved to: {output_path}")
    return str(output_path)

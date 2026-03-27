# server/seeder/seeder/seeders.py

import os
import random
from datetime import datetime, timezone, date
from calendar import monthrange

from .subscription_distributions import pick_subscription_by_distribution

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

from .package_percentages import generate_package_percentage_json


# ----------------------------
# Postal code helpers (CA + US)
# ----------------------------
def rand_postal_code_ca() -> str:
    letters = "ABCEGHJKLMNPRSTVXY"
    digits = "0123456789"
    return (
        random.choice(letters)
        + random.choice(digits)
        + random.choice(letters)
        + " "
        + random.choice(digits)
        + random.choice(letters)
        + random.choice(digits)
    )


def rand_zip_us(zip_plus4: bool = False) -> str:
    zip5 = f"{random.randint(1, 99999):05d}"
    if not zip_plus4:
        return zip5
    return f"{zip5}-{random.randint(0, 9999):04d}"


def rand_postal_mixed(ca_ratio: float = 0.5, us_zip_plus4_ratio: float = 0.15) -> str:
    if random.random() < ca_ratio:
        return rand_postal_code_ca()
    use_plus4 = random.random() < us_zip_plus4_ratio
    return rand_zip_us(zip_plus4=use_plus4)


# ----------------------------
# Latitude / Longitude helpers
# ----------------------------
def rand_between(min_val: float, max_val: float) -> float:
    return min_val + random.random() * (max_val - min_val)


def rand_coord_in_box(
    lat_min: float, lat_max: float, lon_min: float, lon_max: float
) -> tuple[float, float]:
    return (
        round(rand_between(lat_min, lat_max), 6),
        round(rand_between(lon_min, lon_max), 6),
    )


def jitter_coord(
    lat: float,
    lon: float,
    lat_jitter: float = 0.35,
    lon_jitter: float = 0.45,
) -> tuple[float, float]:
    return (
        round(lat + rand_between(-lat_jitter, lat_jitter), 6),
        round(lon + rand_between(-lon_jitter, lon_jitter), 6),
    )


CA_CITY_CENTERS = [
    # name, lat, lon, weight
    ("Toronto", 43.6532, -79.3832, 18),
    ("Montreal", 45.5019, -73.5674, 16),
    ("Vancouver", 49.2827, -123.1207, 12),
    ("Calgary", 51.0447, -114.0719, 8),
    ("Ottawa", 45.4215, -75.6972, 7),
    ("Edmonton", 53.5461, -113.4938, 7),
    ("Quebec City", 46.8139, -71.2080, 5),
    ("Winnipeg", 49.8951, -97.1384, 4),
    ("Halifax", 44.6488, -63.5752, 3),
    ("Victoria", 48.4284, -123.3656, 3),
    ("Saskatoon", 52.1579, -106.6702, 2),
    ("St. John's", 47.5615, -52.7126, 2),
]

US_CITY_CENTERS = [
    ("New York", 40.7128, -74.0060, 16),
    ("Los Angeles", 34.0522, -118.2437, 13),
    ("Chicago", 41.8781, -87.6298, 10),
    ("Houston", 29.7604, -95.3698, 8),
    ("Miami", 25.7617, -80.1918, 8),
    ("Dallas", 32.7767, -96.7970, 7),
    ("Atlanta", 33.7490, -84.3880, 7),
    ("Seattle", 47.6062, -122.3321, 6),
    ("Boston", 42.3601, -71.0589, 6),
    ("Phoenix", 33.4484, -112.0740, 6),
    ("San Francisco", 37.7749, -122.4194, 6),
    ("Denver", 39.7392, -104.9903, 5),
    ("Detroit", 42.3314, -83.0458, 4),
    ("Minneapolis", 44.9778, -93.2650, 4),
    ("Las Vegas", 36.1699, -115.1398, 4),
    ("Philadelphia", 39.9526, -75.1652, 5),
    ("Washington", 38.9072, -77.0369, 5),
    ("Charlotte", 35.2271, -80.8431, 4),
]

CA_SECONDARY_CENTERS = [
    ("Kelowna", 49.8880, -119.4960, 4),
    ("Regina", 50.4452, -104.6189, 4),
    ("Sherbrooke", 45.4042, -71.8929, 4),
    ("Trois-Rivières", 46.3430, -72.5430, 3),
    ("Moncton", 46.0878, -64.7782, 3),
    ("Sudbury", 46.4917, -80.9930, 3),
    ("Red Deer", 52.2681, -113.8112, 2),
    ("Kamloops", 50.6745, -120.3273, 2),
]

US_SECONDARY_CENTERS = [
    ("Portland", 45.5152, -122.6784, 4),
    ("San Diego", 32.7157, -117.1611, 4),
    ("Nashville", 36.1627, -86.7816, 4),
    ("Kansas City", 39.0997, -94.5786, 4),
    ("Columbus", 39.9612, -82.9988, 4),
    ("Indianapolis", 39.7684, -86.1581, 4),
    ("Tampa", 27.9506, -82.4572, 4),
    ("Cleveland", 41.4993, -81.6944, 3),
    ("Raleigh", 35.7796, -78.6382, 3),
    ("Salt Lake City", 40.7608, -111.8910, 3),
]

CA_RURAL_ANCHORS = [
    ("Northern BC", 55.0, -124.0, 2),
    ("Rural Alberta", 53.0, -112.0, 3),
    ("Rural Saskatchewan", 51.5, -106.0, 3),
    ("Northern Ontario", 49.5, -86.0, 3),
    ("Eastern Quebec", 48.5, -68.0, 3),
    ("New Brunswick Rural", 46.2, -66.3, 2),
]

US_RURAL_ANCHORS = [
    ("Montana Rural", 47.0, -109.5, 2),
    ("Wyoming Rural", 43.2, -107.5, 2),
    ("Nebraska Rural", 41.5, -99.5, 3),
    ("Kansas Rural", 38.5, -98.3, 3),
    ("West Texas", 31.5, -102.5, 3),
    ("Dakotas Rural", 46.5, -100.5, 2),
    ("Appalachia", 37.5, -81.5, 3),
]

CA_BOXES = [
    # name, lat_min, lat_max, lon_min, lon_max, weight
    ("BC_AB", 48.0, 57.5, -132.0, -110.0, 4),
    ("Prairies", 49.0, 56.5, -110.0, -95.0, 4),
    ("Ontario", 42.0, 52.5, -95.0, -74.0, 7),
    ("Quebec", 45.0, 53.5, -79.5, -57.0, 6),
    ("Atlantic", 43.0, 49.5, -67.5, -52.0, 3),
]

US_BOXES = [
    ("West", 32.0, 48.8, -124.8, -111.0, 5),
    ("Mountain", 31.0, 48.8, -111.0, -101.0, 4),
    ("Midwest", 35.0, 48.8, -101.0, -84.0, 6),
    ("South", 25.0, 36.8, -100.0, -75.0, 6),
    ("Northeast", 39.0, 47.5, -80.0, -67.0, 5),
]

CA_EAST_CENTERS = [
    ("Montreal", 45.5019, -73.5674, 12),
    ("Ottawa", 45.4215, -75.6972, 8),
    ("Quebec City", 46.8139, -71.2080, 8),
    ("Toronto", 43.6532, -79.3832, 10),
    ("Halifax", 44.6488, -63.5752, 5),
    ("St. John's", 47.5615, -52.7126, 4),
]

US_EAST_CENTERS = [
    ("New York", 40.7128, -74.0060, 14),
    ("Boston", 42.3601, -71.0589, 8),
    ("Philadelphia", 39.9526, -75.1652, 8),
    ("Washington", 38.9072, -77.0369, 8),
    ("Miami", 25.7617, -80.1918, 8),
    ("Atlanta", 33.7490, -84.3880, 8),
    ("Charlotte", 35.2271, -80.8431, 6),
    ("Detroit", 42.3314, -83.0458, 4),
]

CA_WEST_CENTERS = [
    ("Vancouver", 49.2827, -123.1207, 14),
    ("Victoria", 48.4284, -123.3656, 5),
    ("Calgary", 51.0447, -114.0719, 10),
    ("Edmonton", 53.5461, -113.4938, 9),
    ("Saskatoon", 52.1579, -106.6702, 5),
    ("Winnipeg", 49.8951, -97.1384, 4),
]

US_WEST_CENTERS = [
    ("Los Angeles", 34.0522, -118.2437, 12),
    ("San Francisco", 37.7749, -122.4194, 10),
    ("Seattle", 47.6062, -122.3321, 8),
    ("Phoenix", 33.4484, -112.0740, 8),
    ("Denver", 39.7392, -104.9903, 7),
    ("Las Vegas", 36.1699, -115.1398, 5),
    ("Dallas", 32.7767, -96.7970, 4),
]


def weighted_choice_city(city_rows):
    weights = [row[3] for row in city_rows]
    return random.choices(city_rows, weights=weights, k=1)[0]


def weighted_choice_region(rows):
    weights = [row[-1] for row in rows]
    return random.choices(rows, weights=weights, k=1)[0]


def rand_ca_lat_lon() -> tuple[float, float]:
    _, lat, lon, _ = weighted_choice_city(CA_CITY_CENTERS)
    return jitter_coord(lat, lon, lat_jitter=0.32, lon_jitter=0.42)


def rand_us_lat_lon() -> tuple[float, float]:
    _, lat, lon, _ = weighted_choice_city(US_CITY_CENTERS)
    return jitter_coord(lat, lon, lat_jitter=0.40, lon_jitter=0.50)


def rand_lat_lon_for_postal(postal_code: str) -> tuple[float, float]:
    """
    If postal code contains a space and matches Canadian style like 'A1A 1A1',
    treat as Canada. Otherwise treat as US ZIP/ZIP+4.
    """
    postal_code = (postal_code or "").strip()

    is_ca = (
        len(postal_code) >= 7
        and " " in postal_code
        and postal_code[0].isalpha()
    )

    if is_ca:
        return rand_ca_lat_lon()
    return rand_us_lat_lon()


# ----------------------------
# Postal + coordinate distributions
# ----------------------------
POSTAL_DISTRIBUTIONS = {
    "urban_only",
    "uniform_scattered",
    "mixed_realistic",
    "canada_only",
    "usa_only",
    "east_heavy",
    "west_heavy",
    "rural_heavy",
}


def make_postal_for_country(country: str, us_zip_plus4_ratio: float = 0.15) -> str:
    if country == "CA":
        return rand_postal_code_ca()
    return rand_zip_us(zip_plus4=(random.random() < us_zip_plus4_ratio))


def pick_country(ca_ratio: float = 0.5) -> str:
    return "CA" if random.random() < ca_ratio else "US"


def generate_urban_postal_and_coords(ca_ratio: float = 0.45) -> tuple[str, float, float]:
    country = pick_country(ca_ratio=ca_ratio)

    if country == "CA":
        _, lat, lon, _ = weighted_choice_city(CA_CITY_CENTERS)
        lat, lon = jitter_coord(lat, lon, lat_jitter=0.14, lon_jitter=0.20)
        return make_postal_for_country("CA"), lat, lon

    _, lat, lon, _ = weighted_choice_city(US_CITY_CENTERS)
    lat, lon = jitter_coord(lat, lon, lat_jitter=0.16, lon_jitter=0.22)
    return make_postal_for_country("US"), lat, lon


def generate_secondary_city_postal_and_coords(ca_ratio: float = 0.45) -> tuple[str, float, float]:
    country = pick_country(ca_ratio=ca_ratio)

    if country == "CA":
        _, lat, lon, _ = weighted_choice_city(CA_SECONDARY_CENTERS)
        lat, lon = jitter_coord(lat, lon, lat_jitter=0.20, lon_jitter=0.28)
        return make_postal_for_country("CA"), lat, lon

    _, lat, lon, _ = weighted_choice_city(US_SECONDARY_CENTERS)
    lat, lon = jitter_coord(lat, lon, lat_jitter=0.24, lon_jitter=0.32)
    return make_postal_for_country("US"), lat, lon


def generate_suburban_postal_and_coords(ca_ratio: float = 0.45) -> tuple[str, float, float]:
    country = pick_country(ca_ratio=ca_ratio)

    if country == "CA":
        _, lat, lon, _ = weighted_choice_city(CA_CITY_CENTERS + CA_SECONDARY_CENTERS)
        lat, lon = jitter_coord(lat, lon, lat_jitter=0.55, lon_jitter=0.70)
        return make_postal_for_country("CA"), lat, lon

    _, lat, lon, _ = weighted_choice_city(US_CITY_CENTERS + US_SECONDARY_CENTERS)
    lat, lon = jitter_coord(lat, lon, lat_jitter=0.65, lon_jitter=0.80)
    return make_postal_for_country("US"), lat, lon


def generate_rural_postal_and_coords(ca_ratio: float = 0.45) -> tuple[str, float, float]:
    country = pick_country(ca_ratio=ca_ratio)

    if country == "CA":
        _, lat, lon, _ = weighted_choice_city(CA_RURAL_ANCHORS)
        lat, lon = jitter_coord(lat, lon, lat_jitter=1.20, lon_jitter=1.60)
        return make_postal_for_country("CA"), lat, lon

    _, lat, lon, _ = weighted_choice_city(US_RURAL_ANCHORS)
    lat, lon = jitter_coord(lat, lon, lat_jitter=1.40, lon_jitter=1.80)
    return make_postal_for_country("US"), lat, lon


def generate_uniform_scattered_postal_and_coords(ca_ratio: float = 0.45) -> tuple[str, float, float]:
    country = pick_country(ca_ratio=ca_ratio)

    if country == "CA":
        _, lat_min, lat_max, lon_min, lon_max, _ = weighted_choice_region(CA_BOXES)
        lat, lon = rand_coord_in_box(lat_min, lat_max, lon_min, lon_max)
        return make_postal_for_country("CA"), lat, lon

    _, lat_min, lat_max, lon_min, lon_max, _ = weighted_choice_region(US_BOXES)
    lat, lon = rand_coord_in_box(lat_min, lat_max, lon_min, lon_max)
    return make_postal_for_country("US"), lat, lon


def generate_mixed_realistic_postal_and_coords(ca_ratio: float = 0.45) -> tuple[str, float, float]:
    r = random.random()

    if r < 0.60:
        return generate_urban_postal_and_coords(ca_ratio=ca_ratio)

    if r < 0.80:
        return generate_suburban_postal_and_coords(ca_ratio=ca_ratio)

    if r < 0.90:
        return generate_secondary_city_postal_and_coords(ca_ratio=ca_ratio)

    return generate_uniform_scattered_postal_and_coords(ca_ratio=ca_ratio)


def generate_country_only_postal_and_coords(
    country: str, style: str = "mixed_realistic"
) -> tuple[str, float, float]:
    forced_ca_ratio = 1.0 if country == "CA" else 0.0

    if style == "urban_only":
        return generate_urban_postal_and_coords(ca_ratio=forced_ca_ratio)
    if style == "uniform_scattered":
        return generate_uniform_scattered_postal_and_coords(ca_ratio=forced_ca_ratio)
    if style == "rural_heavy":
        return generate_rural_heavy_postal_and_coords(ca_ratio=forced_ca_ratio)

    return generate_mixed_realistic_postal_and_coords(ca_ratio=forced_ca_ratio)


def generate_east_heavy_postal_and_coords(ca_ratio: float = 0.45) -> tuple[str, float, float]:
    country = pick_country(ca_ratio=ca_ratio)

    if country == "CA":
        _, lat, lon, _ = weighted_choice_city(CA_EAST_CENTERS)
        lat, lon = jitter_coord(lat, lon, lat_jitter=0.35, lon_jitter=0.45)
        return make_postal_for_country("CA"), lat, lon

    _, lat, lon, _ = weighted_choice_city(US_EAST_CENTERS)
    lat, lon = jitter_coord(lat, lon, lat_jitter=0.42, lon_jitter=0.55)
    return make_postal_for_country("US"), lat, lon


def generate_west_heavy_postal_and_coords(ca_ratio: float = 0.45) -> tuple[str, float, float]:
    country = pick_country(ca_ratio=ca_ratio)

    if country == "CA":
        _, lat, lon, _ = weighted_choice_city(CA_WEST_CENTERS)
        lat, lon = jitter_coord(lat, lon, lat_jitter=0.35, lon_jitter=0.50)
        return make_postal_for_country("CA"), lat, lon

    _, lat, lon, _ = weighted_choice_city(US_WEST_CENTERS)
    lat, lon = jitter_coord(lat, lon, lat_jitter=0.45, lon_jitter=0.60)
    return make_postal_for_country("US"), lat, lon


def generate_rural_heavy_postal_and_coords(ca_ratio: float = 0.45) -> tuple[str, float, float]:
    r = random.random()

    if r < 0.45:
        return generate_rural_postal_and_coords(ca_ratio=ca_ratio)

    if r < 0.70:
        return generate_uniform_scattered_postal_and_coords(ca_ratio=ca_ratio)

    if r < 0.90:
        return generate_suburban_postal_and_coords(ca_ratio=ca_ratio)

    return generate_urban_postal_and_coords(ca_ratio=ca_ratio)


def generate_postal_and_coords(dist_name: str) -> tuple[str, float, float]:
    dist_name = (dist_name or "mixed_realistic").strip() or "mixed_realistic"

    if dist_name not in POSTAL_DISTRIBUTIONS:
        print(
            f"⚠️  Unknown SEED_POSTAL_DISTRIBUTION='{dist_name}', "
            "falling back to 'mixed_realistic'"
        )
        dist_name = "mixed_realistic"

    if dist_name == "urban_only":
        return generate_urban_postal_and_coords()

    if dist_name == "uniform_scattered":
        return generate_uniform_scattered_postal_and_coords()

    if dist_name == "mixed_realistic":
        return generate_mixed_realistic_postal_and_coords()

    if dist_name == "canada_only":
        return generate_country_only_postal_and_coords("CA", style="mixed_realistic")

    if dist_name == "usa_only":
        return generate_country_only_postal_and_coords("US", style="mixed_realistic")

    if dist_name == "east_heavy":
        return generate_east_heavy_postal_and_coords()

    if dist_name == "west_heavy":
        return generate_west_heavy_postal_and_coords()

    if dist_name == "rural_heavy":
        return generate_rural_heavy_postal_and_coords()

    return generate_mixed_realistic_postal_and_coords()


# ----------------------------
# CC expiration helpers
# ----------------------------
def _ensure_utc(dt) -> datetime:
    if isinstance(dt, date) and not isinstance(dt, datetime):
        return datetime(dt.year, dt.month, dt.day, tzinfo=timezone.utc)

    if not isinstance(dt, datetime):
        raise TypeError(f"_ensure_utc expected date/datetime, got {type(dt)}")

    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def add_years_safe(dt, years: int) -> datetime:
    dt = _ensure_utc(dt)
    y = dt.year + years
    m = dt.month
    d = min(dt.day, monthrange(y, m)[1])
    return dt.replace(year=y, month=m, day=d)


def cc_exp_from_created(created_dt) -> datetime:
    created_dt = _ensure_utc(created_dt)
    years_ahead = random.choice([2, 3, 4])
    exp = add_years_safe(created_dt, years_ahead)
    return exp.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


# ----------------------------
# Schema detection
# ----------------------------
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


# ----------------------------
# Reset DB for reseed (TRUNCATE)
# ----------------------------
def maybe_reset_db(cur):
    if os.environ.get("SEED_RESET", "0").strip() not in ("1", "true", "True"):
        return

    existing = set(list_tables(cur))

    preferred_order = [
        "Payment",
        "Subscription",
        "Customer",
        "Package",
        "Analytics",
        "DataJson",
        "Analysis",
        "AnalyticsDefinition",
    ]
    to_truncate = [t for t in preferred_order if t in existing]

    if not to_truncate:
        print("ℹ️  SEED_RESET=1 but no known tables found to truncate.")
        return

    quoted = ", ".join([f'"{t}"' for t in to_truncate])
    cur.execute(f"TRUNCATE {quoted} RESTART IDENTITY CASCADE;")
    print(f"🧹 Reset DB: truncated {len(to_truncate)} tables ({', '.join(to_truncate)}).")


# ----------------------------
# Seeding: Packages
# ----------------------------
def seed_packages(cur, schema: Schema, n: int) -> tuple[list[int], dict[int, dict[str, int]]]:
    pkg_cols = schema.pkg_cols
    PACKAGE_T = schema.PACKAGE_T

    pkg_pk = pick_col(pkg_cols, ["id", "packageId", "packageID"])
    if not pkg_pk:
        raise SystemExit("Could not detect Package PK column.")

    pkg_name_col = pick_col(pkg_cols, ["name", "title", "packageName"])
    pkg_monthly_col = pick_col(pkg_cols, ["monthlyCost", "monthly_cost", "monthlyCents", "monthly_cents"])
    pkg_annual_col = pick_col(pkg_cols, ["annualCost", "annual_cost", "annualCents", "annual_cents"])

    package_names = [
        "Movies",
        "News",
        "Health",
        "Fashion",
        "Weather",
        "Travel",
        "Adventure",
        "Kids",
        "Science",
        "Religion",
    ]
    n = len(package_names)

    package_rows = []
    for name in package_names:
        row = {}
        if pkg_name_col:
            row[pkg_name_col] = name
        if pkg_monthly_col:
            row[pkg_monthly_col] = random.choice([19, 29, 39, 49, 59, 79, 99])
        if pkg_annual_col:
            row[pkg_annual_col] = random.choice([199, 299, 399, 499, 599, 799, 999])

        if not row:
            raise SystemExit(f'{PACKAGE_T}: no recognized columns to insert.')
        package_rows.append(row)

    pkg_ids = insert_many(cur, PACKAGE_T, package_rows, returning_col=pkg_pk)

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


# ----------------------------
# Seeding: Customers
# ----------------------------
def seed_customers(cur, schema: Schema, n: int, postal_dist_name: str) -> list[int]:
    cust_cols = schema.cust_cols
    CUSTOMER_T = schema.CUSTOMER_T

    cust_pk = pick_col(cust_cols, ["id", "customerId", "customerID"])
    if not cust_pk:
        raise SystemExit("Could not detect Customer PK column.")

    cust_first_col = pick_col(cust_cols, ["firstName", "first_name"])
    cust_last_col = pick_col(cust_cols, ["lastName", "last_name"])
    cust_full_col = pick_col(cust_cols, ["fullName", "name", "customerName"])
    cust_email_col = pick_col(cust_cols, ["email", "emailAddress"])
    cust_postal_col = pick_col(cust_cols, ["postalCode", "postal_code", "zip", "zipcode", "postal"])
    cust_lat_col = pick_col(cust_cols, ["latitude", "lat"])
    cust_lon_col = pick_col(cust_cols, ["longitude", "lon", "lng"])
    cust_since_col = pick_col(cust_cols, ["memberSince", "member_since", "createdAt", "created_at"])
    cust_cc_exp_col = pick_col(cust_cols, ["ccExpiration", "cc_expiration", "cardExpiration", "card_expiration"])

    if not cust_postal_col:
        raise SystemExit(
            f'{CUSTOMER_T}: postalCode is required by schema but was not detected. '
            f"Cols={sorted(list(cust_cols))}"
        )

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

        postal_code, lat, lon = generate_postal_and_coords(postal_dist_name)
        row[cust_postal_col] = postal_code

        if cust_lat_col:
            row[cust_lat_col] = lat
        if cust_lon_col:
            row[cust_lon_col] = lon

        created_dt = rand_past_date()
        if cust_since_col:
            row[cust_since_col] = created_dt

        if cust_cc_exp_col:
            row[cust_cc_exp_col] = cc_exp_from_created(created_dt)

        if not row:
            raise SystemExit(f'{CUSTOMER_T}: no recognized columns to insert.')
        customer_rows.append(row)

    return insert_many(cur, CUSTOMER_T, customer_rows, returning_col=cust_pk)


# ----------------------------
# Seeding: Subscriptions
# ----------------------------
def seed_subscriptions(
    cur,
    schema: Schema,
    n: int,
    cust_ids: list[int],
    pkg_ids: list[int],
    pkg_costs: dict[int, dict[str, int]],
    dist_name: str,
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
    sub_price_col = pick_col(
        sub_cols,
        ["price", "amount", "amountCents", "amount_cents", "priceCents", "price_cents"],
    )

    allowed_statuses = get_enum_labels_for_column(cur, SUB_T, sub_status_col) if sub_status_col else []

    if not sub_start_col:
        raise SystemExit(
            f'{SUB_T}: could not find a start date column (startDate/createdAt). '
            f"Cols={sorted(list(sub_cols))}"
        )

    if not cust_ids or not pkg_ids:
        raise SystemExit("Cannot seed subscriptions: cust_ids or pkg_ids is empty.")

    if dist_name not in ("uniform", "popular_packages", "heavy_monthly", "realistic_default"):
        print(f"⚠️  Unknown SEED_DISTRIBUTION='{dist_name}', falling back to 'uniform'")
        dist_name = "uniform"

    pkg_weights = None
    if dist_name in ("popular_packages", "heavy_monthly", "realistic_default"):
        base = [10, 8, 6, 4, 2]
        pkg_weights = base[: len(pkg_ids)] + [1] * max(0, len(pkg_ids) - len(base))

    cust_weights = None
    if dist_name in ("heavy_monthly", "realistic_default"):
        cust_weights = [random.choice([1, 1, 1, 2, 2, 3, 5]) for _ in cust_ids]

    cycle_weights = (85, 15)
    status_weights_by_key = {"ACTIVE": 85, "CANCEL": 10, "PAST": 5, "OTHER": 3}

    sub_rows = []
    for _ in range(n):
        pick = pick_subscription_by_distribution(
            dist_name,
            cust_ids=cust_ids,
            pkg_ids=pkg_ids,
            allowed_statuses=allowed_statuses,
            pkg_weights=pkg_weights,
            cust_weights=cust_weights,
            cycle_weights=cycle_weights,
            status_weights_by_key=status_weights_by_key,
            max_days_back=1200,
            recent_mean_days=180,
        )

        cycle = pick.cycle if sub_cycle_col else "MONTHLY"

        row = {sub_cust_fk: pick.customer_id, sub_pkg_fk: pick.package_id}

        if sub_cycle_col:
            row[sub_cycle_col] = cycle

        row[sub_start_col] = pick.start_dt

        if sub_status_col:
            row[sub_status_col] = pick.status if allowed_statuses else "ACTIVE"

        if sub_price_col:
            price = None
            if pick.package_id in pkg_costs:
                price = pkg_costs[pick.package_id].get(cycle)
            if price is None:
                price = 29 if cycle == "MONTHLY" else 299
            row[sub_price_col] = price

        sub_rows.append(row)

    insert_many(cur, SUB_T, sub_rows, returning_col=None)


# ----------------------------
# Seeding: AnalyticsDefinition
# ----------------------------
def seed_analytics_definitions(cur):
    ANALYTICS_DEF_T = find_table(
        cur,
        ["AnalyticsDefinition", "analyticsdefinition", "analytics_definitions", "analyticsDefinitions"],
    )
    if not ANALYTICS_DEF_T:
        print("ℹ️  AnalyticsDefinition table not found; skipping analytics definitions seed.")
        return

    cols = get_table_columns(cur, ANALYTICS_DEF_T)

    name_col = pick_col(cols, ["analyticsName", "analytics_name", "name"])
    desc_col = pick_col(cols, ["analyticsDescription", "analytics_description", "description"])
    json_col = pick_col(cols, ["nameOfJSONFile", "name_of_JSON_file", "jsonFile", "json_file"])
    created_col = pick_col(cols, ["createdAt", "created_at"])
    updated_col = pick_col(cols, ["updatedAt", "updated_at"])

    if not name_col or not json_col:
        print(
            f"⚠️  {ANALYTICS_DEF_T}: missing required columns "
            f"(need analyticsName + nameOfJSONFile). Cols={sorted(list(cols))}"
        )
        return

    cur.execute('SELECT COUNT(*) FROM "{}"'.format(ANALYTICS_DEF_T))
    if cur.fetchone()[0] > 0:
        print(f"ℹ️  Seed skipped: {ANALYTICS_DEF_T} already has rows.")
        return

    now = datetime.now(timezone.utc)

    rows = [
        {
            name_col: "Current Geographical Subscriptions",
            **({desc_col: "Line chart of active subscriptions per month"} if desc_col else {}),
            json_col: "monthly_subscriptions.json",
            **({created_col: now} if created_col else {}),
            **({updated_col: now} if updated_col else {}),
        },
        {
            name_col: "Top 5 Packages by percentages",
            **({desc_col: "Top 5 subscribed packages (percentage)"} if desc_col else {}),
            json_col: "packages_top_5.json",
            **({created_col: now} if created_col else {}),
            **({updated_col: now} if updated_col else {}),
        },
    ]

    insert_many(cur, ANALYTICS_DEF_T, rows, returning_col=None)
    print(f"✅ Seeded {len(rows)} analytics definitions into {ANALYTICS_DEF_T}.")


# ----------------------------
# Post-seed: Payments due
# ----------------------------
def run_payments_after_seed(cur, schema: Schema):
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


# ----------------------------
# Main entry
# ----------------------------
def run_seed():
    cfg = load_config()

    dist_name = os.environ.get("SEED_DISTRIBUTION", "uniform").strip() or "uniform"
    postal_dist_name = (
        os.environ.get("SEED_POSTAL_DISTRIBUTION", "mixed_realistic").strip()
    )
    seed_reset = os.environ.get("SEED_RESET", "0").strip() in ("1", "true", "True")

    if cfg.seed_random_seed is not None:
        random.seed(cfg.seed_random_seed)
    else:
        random.seed()

    conn = connect(cfg.db_url)
    try:
        with conn:
            with conn.cursor() as cur:
                schema = detect_schema(cur)

                if seed_reset:
                    maybe_reset_db(cur)

                if (not seed_reset) and cfg.seed_skip_if_exists and seed_guard(cur, schema.CUSTOMER_T):
                    print(f"ℹ️  Seed skipped: {schema.CUSTOMER_T} already has rows.")
                    seed_analytics_definitions(cur)
                    run_payments_after_seed(cur, schema)
                    return

                pkg_ids, pkg_costs = seed_packages(cur, schema, cfg.seed_packages)
                cust_ids = seed_customers(cur, schema, cfg.seed_customers, postal_dist_name)

                seed_subscriptions(
                    cur,
                    schema,
                    cfg.seed_subscriptions,
                    cust_ids,
                    pkg_ids,
                    pkg_costs,
                    dist_name,
                )

                seed_analytics_definitions(cur)

                print("✅ Seed complete:")
                print(f"  Tables: {schema.CUSTOMER_T}, {schema.PACKAGE_T}, {schema.SUB_T}")
                print("  Packages: 10 (fixed names)")
                print(f"  Customers: {cfg.seed_customers}")
                print(f"  Subscriptions: {cfg.seed_subscriptions}")
                print(f"  Distribution: {dist_name}")
                print(f"  Postal distribution: {postal_dist_name}")
                print(f"  Reset first: {'YES' if seed_reset else 'NO'}")

                run_payments_after_seed(cur, schema)
                generate_package_percentage_json(cur)

    finally:
        conn.close()


if __name__ == "__main__":
    run_seed()
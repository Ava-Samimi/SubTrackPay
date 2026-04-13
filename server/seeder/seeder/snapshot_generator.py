from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, date
from pathlib import Path
from typing import Any

import matplotlib
matplotlib.use("Agg")

import matplotlib.pyplot as plt


DEFAULT_OUTPUT_DIR = (
    Path(__file__).resolve().parents[3] / "client" / "public" / "snapshots"
)


def _first_present(row: dict[str, Any], keys: list[str], default: Any = None) -> Any:
    for key in keys:
        if key in row and row[key] is not None:
            return row[key]
    return default


def _safe_float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _safe_dt(value: Any) -> datetime | None:
    if value is None:
        return None

    if isinstance(value, datetime):
        return value

    if isinstance(value, date):
        return datetime(value.year, value.month, value.day)

    if isinstance(value, str):
        text = value.strip()
        if not text:
            return None

        if text.endswith("Z"):
            text = text[:-1] + "+00:00"

        fmts = [
            "%Y-%m-%d",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%d %H:%M:%S.%f",
        ]
        for fmt in fmts:
            try:
                return datetime.strptime(text, fmt)
            except ValueError:
                pass

        try:
            return datetime.fromisoformat(text)
        except ValueError:
            return None

    return None


def _infer_country_from_postal(postal_code: Any) -> str:
    if postal_code is None:
        return "Unknown"

    text = str(postal_code).strip()
    if len(text) >= 7 and " " in text and text[0].isalpha():
        return "Canada"

    if text:
        return "USA"

    return "Unknown"


def _normalize_cycle(value: Any) -> str:
    if value is None:
        return "Unknown"

    text = str(value).strip().upper()

    if text in {"MONTHLY", "MONTH", "M"}:
        return "Monthly"
    if text in {"ANNUAL", "YEARLY", "YEAR", "Y"}:
        return "Annual"

    return text.title() if text else "Unknown"


def _normalize_status(value: Any) -> str:
    if value is None:
        return "Unknown"

    text = str(value).strip().upper()

    if "ACTIVE" in text:
        return "Active"
    if "CANCEL" in text:
        return "Cancelled"
    if "PAST" in text:
        return "Past Due"
    if "PAUSE" in text:
        return "Paused"
    if "TRIAL" in text:
        return "Trial"

    return text.title() if text else "Unknown"


def _ensure_output_dir(output_dir: str | Path) -> Path:
    path = Path(output_dir).resolve()
    path.mkdir(parents=True, exist_ok=True)
    return path


def _new_figure(figsize: tuple[int, int] = (12, 8)) -> tuple[Any, Any]:
    fig, ax = plt.subplots(figsize=figsize, dpi=200)
    fig.patch.set_facecolor("white")
    ax.set_facecolor("white")
    ax.grid(True, alpha=0.25)
    return fig, ax


def _save_and_close(fig: Any, output_path: Path) -> None:
    fig.tight_layout()
    fig.savefig(output_path, bbox_inches="tight")
    plt.close(fig)


def _extract_customer_points(customers: list[dict[str, Any]]) -> list[dict[str, Any]]:
    points: list[dict[str, Any]] = []

    for row in customers:
        postal = _first_present(row, ["postalCode", "postal_code", "zip", "zipcode", "postal"])
        lat = _safe_float(_first_present(row, ["latitude", "lat"]))
        lon = _safe_float(_first_present(row, ["longitude", "lon", "lng"]))
        created = _safe_dt(_first_present(row, ["memberSince", "member_since", "createdAt", "created_at"]))

        points.append(
            {
                "postal": postal,
                "country": _infer_country_from_postal(postal),
                "lat": lat,
                "lon": lon,
                "created": created,
            }
        )

    return points


def _extract_subscription_rows(subscriptions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []

    for row in subscriptions:
        pkg_id = _first_present(row, ["packageID", "packageId", "package_id"])
        cycle = _normalize_cycle(_first_present(row, ["billingCycle", "billing_cycle", "cycle"]))
        status = _normalize_status(_first_present(row, ["status", "state"]))
        start_dt = _safe_dt(_first_present(row, ["startDate", "start_date", "createdAt", "created_at"]))

        rows.append(
            {
                "package_id": pkg_id,
                "cycle": cycle,
                "status": status,
                "start_dt": start_dt,
            }
        )

    return rows


def _plot_geo_distribution(
    customer_points: list[dict[str, Any]],
    output_path: Path,
    postal_distribution: str | None = None,
) -> None:
    fig, ax = _new_figure()

    ca_x, ca_y = [], []
    us_x, us_y = [], []
    unk_x, unk_y = [], []

    for p in customer_points:
        lat = p["lat"]
        lon = p["lon"]
        if lat is None or lon is None:
            continue

        if p["country"] == "Canada":
            ca_x.append(lon)
            ca_y.append(lat)
        elif p["country"] == "USA":
            us_x.append(lon)
            us_y.append(lat)
        else:
            unk_x.append(lon)
            unk_y.append(lat)

    if ca_x:
        ax.scatter(ca_x, ca_y, s=20, alpha=0.75, label="Canada")
    if us_x:
        ax.scatter(us_x, us_y, s=20, alpha=0.75, label="USA")
    if unk_x:
        ax.scatter(unk_x, unk_y, s=20, alpha=0.75, label="Unknown")

    title = "Snapshot 1 — Geographic Distribution"
    if postal_distribution:
        title += f"\nPostal distribution: {postal_distribution}"
    ax.set_title(title, fontsize=14, fontweight="bold")
    ax.set_xlabel("Longitude")
    ax.set_ylabel("Latitude")

    handles, labels = ax.get_legend_handles_labels()
    if handles:
        ax.legend()

    _save_and_close(fig, output_path)


def _plot_country_split(
    customer_points: list[dict[str, Any]],
    output_path: Path,
) -> None:
    counts = Counter(p["country"] for p in customer_points if p.get("country"))
    labels = list(counts.keys())
    values = list(counts.values())

    fig, ax = _new_figure()

    if sum(values) == 0:
        ax.text(0.5, 0.5, "No country data available", ha="center", va="center", fontsize=14)
        ax.set_axis_off()
    else:
        ax.pie(values, labels=labels, autopct="%1.1f%%", startangle=90)
        ax.set_title("Snapshot 2 — Country Split", fontsize=14, fontweight="bold")

    _save_and_close(fig, output_path)


def _plot_package_distribution(
    subscription_rows: list[dict[str, Any]],
    package_lookup: dict[Any, str],
    output_path: Path,
) -> None:
    counts: Counter[str] = Counter()

    for row in subscription_rows:
        pkg_id = row["package_id"]
        pkg_name = package_lookup.get(pkg_id, f"Package {pkg_id}")
        counts[pkg_name] += 1

    names = list(counts.keys())
    values = list(counts.values())

    fig, ax = _new_figure(figsize=(13, 8))

    if not values:
        ax.text(0.5, 0.5, "No subscription/package data available", ha="center", va="center", fontsize=14)
        ax.set_axis_off()
    else:
        pairs = sorted(zip(names, values), key=lambda x: x[1], reverse=True)
        names = [p[0] for p in pairs]
        values = [p[1] for p in pairs]

        ax.bar(names, values)
        ax.set_title("Snapshot 3 — Package Distribution", fontsize=14, fontweight="bold")
        ax.set_xlabel("Package")
        ax.set_ylabel("Subscription count")
        ax.tick_params(axis="x", rotation=30)

    _save_and_close(fig, output_path)


def _plot_subscription_status(
    subscription_rows: list[dict[str, Any]],
    output_path: Path,
) -> None:
    counts = Counter(row["status"] for row in subscription_rows if row.get("status"))
    labels = list(counts.keys())
    values = list(counts.values())

    fig, ax = _new_figure()

    if sum(values) == 0:
        ax.text(0.5, 0.5, "No subscription status data available", ha="center", va="center", fontsize=14)
        ax.set_axis_off()
    else:
        ax.pie(values, labels=labels, autopct="%1.1f%%", startangle=90)
        ax.set_title("Snapshot 4 — Subscription Status", fontsize=14, fontweight="bold")

    _save_and_close(fig, output_path)


def _plot_billing_cycle(
    subscription_rows: list[dict[str, Any]],
    output_path: Path,
) -> None:
    counts = Counter(row["cycle"] for row in subscription_rows if row.get("cycle"))
    labels = list(counts.keys())
    values = list(counts.values())

    fig, ax = _new_figure()

    if not values:
        ax.text(0.5, 0.5, "No billing cycle data available", ha="center", va="center", fontsize=14)
        ax.set_axis_off()
    else:
        pairs = sorted(zip(labels, values), key=lambda x: x[0])
        labels = [p[0] for p in pairs]
        values = [p[1] for p in pairs]

        ax.bar(labels, values)
        ax.set_title("Snapshot 5 — Billing Cycle", fontsize=14, fontweight="bold")
        ax.set_xlabel("Cycle")
        ax.set_ylabel("Subscription count")

    _save_and_close(fig, output_path)


def _plot_customer_creation_timeline(
    customer_points: list[dict[str, Any]],
    output_path: Path,
) -> None:
    month_counts: dict[str, int] = defaultdict(int)

    for p in customer_points:
        dt = p.get("created")
        if not dt:
            continue
        key = dt.strftime("%Y-%m")
        month_counts[key] += 1

    fig, ax = _new_figure(figsize=(14, 8))

    if not month_counts:
        ax.text(0.5, 0.5, "No customer date data available", ha="center", va="center", fontsize=14)
        ax.set_axis_off()
    else:
        labels = sorted(month_counts.keys())
        values = [month_counts[k] for k in labels]

        ax.bar(labels, values)
        ax.set_title("Snapshot 6 — Customer Creation Timeline", fontsize=14, fontweight="bold")
        ax.set_xlabel("Year-Month")
        ax.set_ylabel("Customer count")
        ax.tick_params(axis="x", rotation=45)

    _save_and_close(fig, output_path)


def generate_snapshots(
    *,
    customers: list[dict[str, Any]],
    subscriptions: list[dict[str, Any]],
    package_lookup: dict[Any, str],
    output_dir: str | Path = DEFAULT_OUTPUT_DIR,
    postal_distribution: str | None = None,
    subscription_distribution: str | None = None,
) -> dict[str, str]:
    print("DEBUG SG 1: generate_snapshots() was entered")

    out_dir = _ensure_output_dir(output_dir)
    print(f"DEBUG SG 2: output dir = {out_dir}")

    test_file = out_dir / "snapshot_test.txt"
    test_file.write_text("snapshot generator ran", encoding="utf-8")
    print(f"DEBUG SG 3: wrote test file = {test_file}")

    customer_points = _extract_customer_points(customers)
    subscription_rows = _extract_subscription_rows(subscriptions)

    paths = {
        "geo_distribution": out_dir / "snapshot_1_geo_distribution.png",
        "country_split": out_dir / "snapshot_2_country_split.png",
        "package_distribution": out_dir / "snapshot_3_package_distribution.png",
        "subscription_status": out_dir / "snapshot_4_subscription_status.png",
        "billing_cycle": out_dir / "snapshot_5_billing_cycle.png",
        "customer_creation_timeline": out_dir / "snapshot_6_customer_creation_timeline.png",
    }

    _plot_geo_distribution(
        customer_points,
        paths["geo_distribution"],
        postal_distribution=postal_distribution,
    )
    _plot_country_split(customer_points, paths["country_split"])
    _plot_package_distribution(subscription_rows, package_lookup, paths["package_distribution"])
    _plot_subscription_status(subscription_rows, paths["subscription_status"])
    _plot_billing_cycle(subscription_rows, paths["billing_cycle"])
    _plot_customer_creation_timeline(customer_points, paths["customer_creation_timeline"])

    print("DEBUG SG 4: all snapshot plots finished")

    if subscription_distribution:
        print(f"ℹ️  Snapshot subscription distribution context: {subscription_distribution}")
    if postal_distribution:
        print(f"ℹ️  Snapshot postal distribution context: {postal_distribution}")

    print("✅ Snapshot images generated:")
    for key, path in paths.items():
        print(f"  {key}: {path}")

    return {key: str(path) for key, path in paths.items()}


def build_package_lookup_from_rows(package_rows: list[dict[str, Any]]) -> dict[Any, str]:
    lookup: dict[Any, str] = {}

    for row in package_rows:
        pkg_id = _first_present(row, ["id", "packageId", "packageID"])
        pkg_name = _first_present(row, ["name", "title", "packageName"])

        if pkg_id is not None and pkg_name:
            lookup[pkg_id] = str(pkg_name)

    return lookup
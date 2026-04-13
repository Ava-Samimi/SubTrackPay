# server/seeder/seeder/subscription_distributions.py

from __future__ import annotations

import math
import random
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from typing import Optional, Sequence


@dataclass(frozen=True)
class SubscriptionPick:
    customer_id: int
    package_id: int
    cycle: str                 # "MONTHLY" or "ANNUAL"
    status: str                # e.g. "ACTIVE"
    start_dt: datetime         # timezone-aware UTC datetime


def _pick_weighted(items: Sequence[int], weights: Optional[Sequence[float]] = None) -> int:
    if not items:
        raise ValueError("Cannot pick from empty items.")
    if weights is None:
        return random.choice(list(items))
    if len(weights) != len(items):
        raise ValueError("weights length must match items length.")
    return random.choices(list(items), weights=list(weights), k=1)[0]


def _pick_cycle(monthly_pct: int, annual_pct: int) -> str:
    # e.g. monthly_pct=85, annual_pct=15
    return random.choices(["MONTHLY", "ANNUAL"], weights=[monthly_pct, annual_pct], k=1)[0]


def _pick_status(allowed_statuses: Sequence[str], weights_by_key: Optional[dict[str, int]] = None) -> str:
    # weights_by_key example:
    # {"ACTIVE": 80, "CANCEL": 10, "PAST": 10, "OTHER": 5}
    if not allowed_statuses:
        return "ACTIVE"

    if not weights_by_key:
        return random.choice(list(allowed_statuses))

    weights = []
    for s in allowed_statuses:
        s_up = (s or "").upper()
        if "ACTIVE" in s_up:
            weights.append(weights_by_key.get("ACTIVE", 60))
        elif "CANCEL" in s_up:
            weights.append(weights_by_key.get("CANCEL", 10))
        elif "PAST" in s_up or "EXPIRE" in s_up:
            weights.append(weights_by_key.get("PAST", 10))
        else:
            weights.append(weights_by_key.get("OTHER", 5))

    return random.choices(list(allowed_statuses), weights=weights, k=1)[0]


def _start_date_uniform(max_days_back: int) -> datetime:
    # uniform day selection over last max_days_back
    days_ago = random.randint(0, max_days_back)
    return datetime.now(timezone.utc) - timedelta(days=days_ago)


def _start_date_recent_heavy(max_days_back: int, mean_days: int = 180) -> datetime:
    # exponential: many recent, fewer old
    u = random.random()
    days_ago = int(-mean_days * math.log(1 - u))
    days_ago = min(days_ago, max_days_back)
    return datetime.now(timezone.utc) - timedelta(days=days_ago)


def pick_subscription_by_distribution(
    distribution: str,
    cust_ids: Sequence[int],
    pkg_ids: Sequence[int],
    allowed_statuses: Sequence[str],
    *,
    # optional knobs (used by some distributions)
    pkg_weights: Optional[Sequence[float]] = None,
    cust_weights: Optional[Sequence[float]] = None,
    cycle_weights: tuple[int, int] = (50, 50),  # (MONTHLY%, ANNUAL%)
    status_weights_by_key: Optional[dict[str, int]] = None,
    max_days_back: int = 1200,
    recent_mean_days: int = 180,
) -> SubscriptionPick:
    """
    distribution options (built-in):
      - "uniform": everything uniform
      - "popular_packages": weighted packages, uniform customers
      - "heavy_monthly": skew cycle to monthly (uses cycle_weights)
      - "realistic_default": popular packages + heavy monthly + status weighting + recent-heavy dates

    You can add your own distribution names later without touching seeders.py.
    """

    dist = (distribution or "uniform").strip().lower()

    # defaults
    if dist == "uniform":
        cust_id = _pick_weighted(cust_ids, None)
        pkg_id = _pick_weighted(pkg_ids, None)
        cycle = _pick_cycle(cycle_weights[0], cycle_weights[1])
        status = _pick_status(allowed_statuses, None)
        start_dt = _start_date_uniform(max_days_back)

    elif dist == "popular_packages":
        cust_id = _pick_weighted(cust_ids, None)
        pkg_id = _pick_weighted(pkg_ids, pkg_weights)
        cycle = _pick_cycle(cycle_weights[0], cycle_weights[1])
        status = _pick_status(allowed_statuses, None)
        start_dt = _start_date_uniform(max_days_back)

    elif dist == "heavy_monthly":
        cust_id = _pick_weighted(cust_ids, cust_weights)
        pkg_id = _pick_weighted(pkg_ids, pkg_weights)
        cycle = _pick_cycle(cycle_weights[0], cycle_weights[1])
        status = _pick_status(allowed_statuses, None)
        start_dt = _start_date_uniform(max_days_back)

    elif dist == "realistic_default":
        cust_id = _pick_weighted(cust_ids, cust_weights)
        pkg_id = _pick_weighted(pkg_ids, pkg_weights)

        # good defaults if caller didn't pass anything:
        monthly, annual = cycle_weights
        if (monthly, annual) == (50, 50):
            monthly, annual = (85, 15)

        cycle = _pick_cycle(monthly, annual)

        # status weighting default
        weights_map = status_weights_by_key or {"ACTIVE": 80, "CANCEL": 10, "PAST": 10, "OTHER": 5}
        status = _pick_status(allowed_statuses, weights_map)

        # recent-heavy dates
        start_dt = _start_date_recent_heavy(max_days_back, mean_days=recent_mean_days)

    else:
        raise ValueError(
            f"Unknown subscription distribution '{distribution}'. "
            f"Try: uniform, popular_packages, heavy_monthly, realistic_default"
        )

    return SubscriptionPick(
        customer_id=int(cust_id),
        package_id=int(pkg_id),
        cycle=str(cycle),
        status=str(status),
        start_dt=start_dt,
    )

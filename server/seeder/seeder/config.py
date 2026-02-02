import os
from dataclasses import dataclass
from urllib.parse import urlparse, urlunparse
from typing import Optional


def strip_prisma_schema_query(url: str) -> str:
    # psycopg2 doesn't accept Prisma's ?schema=public
    if "?" in url and "schema=" in url:
        p = urlparse(url)
        return urlunparse((p.scheme, p.netloc, p.path, p.params, "", p.fragment))
    return url


def _parse_optional_int(env_value: Optional[str]) -> Optional[int]:
    """
    Returns:
      - None if env_value is None, empty, or "0"
      - int otherwise
    """
    if env_value is None:
        return None
    s = env_value.strip()
    if s == "" or s == "0":
        return None
    return int(s)


@dataclass(frozen=True)
class SeedConfig:
    db_url: str
    seed_customers: int
    seed_packages: int
    seed_subscriptions: int
    seed_random_seed: Optional[int]  # ✅ optional now
    seed_skip_if_exists: bool


def load_config() -> SeedConfig:
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        raise SystemExit("Missing DATABASE_URL env var.")
    db_url = strip_prisma_schema_query(db_url)

    seed_skip_if_exists = os.environ.get("SEED_SKIP_IF_EXISTS", "1").strip() not in ("0", "false", "False")

    return SeedConfig(
        db_url=db_url,
        seed_customers=int(os.environ.get("SEED_CUSTOMERS", "500")),
        seed_packages=int(os.environ.get("SEED_PACKAGES", "5")),
        seed_subscriptions=int(os.environ.get("SEED_SUBSCRIPTIONS", "500")),
        seed_random_seed=_parse_optional_int(os.environ.get("SEED_RANDOM_SEED")),  # ✅ no default 42
        seed_skip_if_exists=seed_skip_if_exists,
    )

import random
import string
from datetime import date, timedelta

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

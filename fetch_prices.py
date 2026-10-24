#!/usr/bin/env python

import csv
import json
import os
import sys
from collections import defaultdict
from enum import IntEnum
from pathlib import Path

import requests

SREALITY_URL = "https://www.sreality.cz/api/v1/top_districts?category_main_cb={}&category_type_cb={}&type=all"
ARAD_DATA_URL = "https://www.cnb.cz/aradb/api/v1/data"
ARAD_API_KEY = os.environ.get("ARAD_API_KEY")
INTEREST_RATE_CODE = "SFTP01D15"  # ČNB 2W repo rate

prices = defaultdict(dict)


class CategoryMain(IntEnum):
    apartment = 1
    house = 2


class CategoryType(IntEnum):
    buying = 1
    renting = 2


def fetch_interest_rate(api_key):
    r = requests.get(
        ARAD_DATA_URL,
        params={
            "api_key": api_key,
            "indicator_id_list": INTEREST_RATE_CODE,
            "months_before": 3,
            "period_sort": "desc",
            "delimiter": "semicolon",
            "decimal_separator": "point",
        },
    )
    if not r.ok:
        sys.exit(f"ARAD API returned HTTP {r.status_code}: {r.text.strip()}")

    # The API returns a CSV file in Windows-1250 with CR+LF line endings.
    r.encoding = "cp1250"
    rows = csv.DictReader(r.text.splitlines(), delimiter=";")

    for row in rows:
        row = {(k or "").strip(): (v or "").strip() for k, v in row.items()}
        if row.get("indicator_id") == INTEREST_RATE_CODE and row.get("value"):
            return float(row["value"])

    sys.exit(f"ARAD API returned no value for {INTEREST_RATE_CODE}")


if not ARAD_API_KEY:
    sys.exit(
        "ARAD_API_KEY is not set. Generate the key in your ČNB ARAD account "
        "(user menu -> API Key Management) and pass it in the environment."
    )

for category_main in CategoryMain:
    for category_type in CategoryType:
        r = requests.get(SREALITY_URL.format(category_main, category_type))
        r.raise_for_status()
        prices[category_main.name][category_type.name] = r.json().get("top_districts")

prices["interest_rate"] = fetch_interest_rate(ARAD_API_KEY)

with Path("www", "prices.json").open("w") as f:
    f.write(json.dumps(prices))

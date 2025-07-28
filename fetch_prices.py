#!/usr/bin/env python

import json
from collections import defaultdict
from enum import IntEnum
from pathlib import Path

import requests

SREALITY_URL = "https://www.sreality.cz/api/v1/top_districts?category_main_cb={}&category_type_cb={}&type=all"
CNB_URL = "https://www.cnb.cz/aradb/api/v13/main-indicators?groupId=1"
INTEREST_RATE_CODE = "SFTP01D15"

prices = defaultdict(dict)


class CategoryMain(IntEnum):
    apartment = 1
    house = 2


class CategoryType(IntEnum):
    buying = 1
    renting = 2


for category_main in CategoryMain:
    for category_type in CategoryType:
        r = requests.get(SREALITY_URL.format(category_main, category_type))
        r.raise_for_status()
        prices[category_main.name][category_type.name] = r.json().get("top_districts")

r = requests.get(CNB_URL)
r.raise_for_status()

for indicator in (r.json().get("subgroups") or [{}])[0].get("indicators") or []:
    if indicator.get("code") == INTEREST_RATE_CODE:
        prices["interest_rate"] = float(
            (indicator.get("value") or "0").replace(",", ".")
        )

with Path("www", "prices.json").open("w") as f:
    f.write(json.dumps(prices))

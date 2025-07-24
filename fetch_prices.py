#!/usr/bin/env python

import json
from collections import defaultdict
from enum import IntEnum
from pathlib import Path

import requests

URL = "https://www.sreality.cz/api/v1/top_districts?category_main_cb={}&category_type_cb={}&type=all"

prices = defaultdict(dict)


class CategoryMain(IntEnum):
    apartment = 1
    house = 2


class CategoryType(IntEnum):
    buying = 1
    renting = 2


for category_main in CategoryMain:
    for category_type in CategoryType:
        r = requests.get(URL.format(category_main, category_type))
        r.raise_for_status()
        prices[category_main.name][category_type.name] = r.json().get("top_districts")

with Path("www", "prices.json").open("w") as f:
    f.write(json.dumps(prices))

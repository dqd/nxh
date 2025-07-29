let prices;
const regions = {
    "Hlavní město Praha": [
        "Praha 1",
        "Praha 2",
        "Praha 3",
        "Praha 4",
        "Praha 5",
        "Praha 6",
        "Praha 7",
        "Praha 8",
        "Praha 9",
        "Praha 10"
    ],
    "Jihočeský kraj": [
        "České Budějovice",
        "Český Krumlov",
        "Jindřichův Hradec",
        "Písek",
        "Prachatice",
        "Strakonice",
        "Tábor"
    ],
    "Jihomoravský kraj": [
        "Blansko",
        "Brno-město",
        "Brno-venkov",
        "Břeclav",
        "Hodonín",
        "Vyškov",
        "Znojmo"
    ],
    "Karlovarský kraj": [
        "Cheb",
        "Karlovy Vary",
        "Sokolov"
    ],
    "Kraj Vysočina": [
        "Havlíčkův Brod",
        "Jihlava",
        "Pelhřimov",
        "Třebíč",
        "Žďár nad Sázavou"
    ],
    "Královéhradecký kraj": [
        "Hradec Králové",
        "Jičín",
        "Náchod",
        "Rychnov nad Kněžnou",
        "Trutnov"
    ],
    "Liberecký kraj": [
        "Česká Lípa",
        "Jablonec nad Nisou",
        "Liberec",
        "Semily"
    ],
    "Moravskoslezský kraj": [
        "Bruntál",
        "Frýdek-Místek",
        "Karviná",
        "Nový Jičín",
        "Opava",
        "Ostrava-město"
    ],
    "Olomoucký kraj": [
        "Jeseník",
        "Olomouc",
        "Prostějov",
        "Přerov",
        "Šumperk"
    ],
    "Pardubický kraj": [
        "Chrudim",
        "Pardubice",
        "Svitavy",
        "Ústí nad Orlicí"
    ],
    "Plzeňský kraj": [
        "Domažlice",
        "Klatovy",
        "Plzeň-město",
        "Plzeň-jih",
        "Plzeň-sever",
        "Rokycany",
        "Tachov"
    ],
    "Středočeský kraj": [
        "Benešov",
        "Beroun",
        "Kladno",
        "Kolín",
        "Kutná Hora",
        "Mělník",
        "Mladá Boleslav",
        "Nymburk",
        "Praha-východ",
        "Praha-západ",
        "Příbram",
        "Rakovník"
    ],
    "Ústecký kraj": [
        "Děčín",
        "Chomutov",
        "Litoměřice",
        "Louny",
        "Most",
        "Teplice",
        "Ústí nad Labem"
    ],
    "Zlínský kraj": [
        "Kroměříž",
        "Uherské Hradiště",
        "Vsetín",
        "Zlín"
    ]
};
const INCOME_TAX = 0.15,
    REF_SIZE = 50,
    MIN_FACTOR = 0.75,
    MAX_FACTOR = 1.25,
    ALPHA_DEFAULT = 0.15,
    ALPHA_PRAGUE = 0.25,
    ALPHA_DIFF = 0.005,
    ALPHA_BRNO = 0.18,
    EXPENSIVE_RENT = 40000,
    LTV_DEFAULT = 80,
    PROPERTY_TAX = 3.5,
    PROPERTY_TAX_STOREY = 1.4,
    PROPERTY_TAX_APARTMENT = 1.2,
    COEFFICIENT_PRAGUE = 4.5,
    COEFFICIENT_BRNO = 3.5,
    COEFFICIENT_DEFAULT = 2.5,
    EXPENSES_RATE = 0.3,
    EXPENSES_CEILING = 2000000,
    MORTGAGE_CEILING = 150000,
    WRITE_OFF_YEARS = 30,
    TAXABLE_INVESTMENT_YEARS = 3;


function fillLocations() {
    // sanity check: do the districts match?
    let districts = Object.values(regions).flat(),
        type = document.getElementById("type").value,
        location = document.getElementById("location");

    prices[type].buying.forEach(function(item) {
        let index = districts.indexOf(item.district);

        if (index === -1) {
            console.warn(`Unknown district: ${item.district}`);
        } else {
            districts.splice(index, 1);
        }
    });

    if (districts.length) {
        console.warn(`Regions without prices: ${districts.join()}`);
    }

    // actual filling the locations up
    for (let [region, districts] of Object.entries(regions)) {
        let group = document.createElement("optgroup");
        group.label = region;

        districts.forEach(function(district) {
            let option = document.createElement("option");
            option.value = district;
            option.textContent = district;
            group.appendChild(option);
        });

        location.appendChild(group);
    }
}

function formatNumber(number) {
    return Math.trunc(number).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\xa0");
}

function formatPercent(number) {
    return Math.abs(number).toString().replace(".", ",") + " %";
}

function estimatePrice(ppsmRef, area, alpha) {
    return ppsmRef * Math.max(MIN_FACTOR, Math.min(MAX_FACTOR, Math.pow(area / REF_SIZE, -alpha))) * area;
}

function setPrice() {
    let location = document.getElementById("location").value,
        type = document.getElementById("type").value;

    for (let [living, items] of Object.entries(prices[type])) {
        for (let item of items) {
            if (item.district === location) {
                let area = parseInt(document.getElementById("area").value, 10),
                    alpha = ALPHA_DEFAULT,
                    isPrague = location.match(/Praha \d+/);

                if (isPrague) {
                    alpha = ALPHA_PRAGUE - ALPHA_DIFF * parseInt(location.replace(/\D+/g, ""), 10);
                } else if (location === "Brno-město") {
                    alpha = ALPHA_BRNO;
                }

                let priceInput = document.getElementById(`${living}-price`);
                priceInput.value = formatNumber(estimatePrice(item.avg_price_per_area, area, alpha));
                priceInput.dispatchEvent(new Event("change"));

                document.getElementById(`${living}-price-quarter`).textContent = item.actual_quarter;
                document.getElementById(`${living}-price-average`).textContent = formatNumber(item.avg_price_per_area);
                document.getElementById(`${living}-price-difference`).textContent = (
                    (item.difference > 0 ? "nárůst" : "pokles") + " o " + formatPercent(item.difference)
                );
                break;
            }
        }
    }
}

function estimateCommission() {
    let price = parseInt(document.getElementById("renting-price").value.replaceAll("\xa0", ""), 10) || 0;
    document.getElementById("commission").value = formatNumber((price > EXPENSIVE_RENT ? 1 : 2) * price);
}

function calculatePayments(mortgage) {
    let monthlyRate = parseFloat(document.getElementById("interest-rate").value) / (100 * 12),
        payments = parseInt(document.getElementById("maturity").value, 10) * 12,
        monthlyPayment,
        paid;

    if (monthlyRate) {
        let compoundFactor = Math.pow(1 + monthlyRate, payments);
        monthlyPayment = Math.round(mortgage * monthlyRate * compoundFactor / (compoundFactor - 1));
        paid = monthlyPayment * payments;
    } else {
        monthlyPayment = Math.round(mortgage / payments);
        paid = mortgage;
    }

    document.getElementById("mortgage").textContent = formatNumber(mortgage);
    document.getElementById("payment").textContent = formatNumber(monthlyPayment);
    document.getElementById("paid").textContent = formatNumber(paid);
    document.getElementById("interest").textContent = formatNumber(paid - mortgage);
    calculateProfitability();
}

function calculateMortgage() {
    let price = parseInt(document.getElementById("buying-price").value.replaceAll("\xa0", ""), 10) || 0,
        ltv = parseFloat(document.getElementById("ltv").value);

    if (ltv) {
        let mortgage = Math.round(price * ltv / 100);
        document.getElementById("downpayment").value = formatNumber(price - mortgage);
        calculatePayments(mortgage);
    } else {
        document.getElementById("ltv").value = LTV_DEFAULT;
    }
}

function calculateLTV() {
    let price = parseInt(document.getElementById("buying-price").value.replaceAll("\xa0", ""), 10) || 0,
        downpayment = parseInt(document.getElementById("downpayment").value.replaceAll("\xa0", ""), 10) || 0,
        mortgage = price - downpayment;

    document.getElementById("ltv").value = (mortgage / price * 100).toFixed(3);
    calculatePayments(mortgage);
}

function estimateInsurance() {
    let price = parseInt(document.getElementById("buying-price").value.replaceAll("\xa0", ""), 10) || 0,
        insuranceInput = document.getElementById("insurance");
    insuranceInput.value = formatNumber(Math.round(price / Math.pow(10, 5)) * Math.pow(10, 2));
    insuranceInput.dispatchEvent(new Event("change"));
}

function estimateHOAPayments() {
    let type = document.getElementById("type").value,
        area = parseInt(document.getElementById("area").value, 10),
        hoaInput = document.getElementById("hoa");

    if (type === "apartment") {
        hoaInput.value = formatNumber(50 * area);
    } else {
        hoaInput.value = formatNumber(0);
    }
    hoaInput.dispatchEvent(new Event("change"));
}

function calculatePropertyTax() {
    let isHouse = document.getElementById("type").value === "house",
        area = parseInt(document.getElementById("property-tax-area").value, 10) || 0,
        storeys = parseInt(document.getElementById("property-tax-storeys").value, 10) || 0,
        coefficient = parseFloat(document.getElementById("property-tax-coefficient").value) || 1,
        localCoefficient = parseFloat(document.getElementById("property-tax-coefficient-local").value) || 1,
        inflationCoefficient = parseFloat(document.getElementById("property-tax-coefficient-inflation").value) || 1,
        propertyTaxInput = document.getElementById("property-tax");

    propertyTaxInput.value = formatNumber(
        (PROPERTY_TAX + (isHouse ? storeys * PROPERTY_TAX_STOREY : 0))
        * (isHouse ? 1 : PROPERTY_TAX_APARTMENT)
        * coefficient * localCoefficient * inflationCoefficient * area
    );
    propertyTaxInput.dispatchEvent(new Event("change"));
}

function setPropertyTax() {
    let isHouse = document.getElementById("type").value === "house",
        isDisplayed = document.getElementById("show-property-tax-calculation").parentNode.hasAttribute("hidden"),
        location = document.getElementById("location").value,
        storeys = document.getElementById("property-tax-storeys").parentNode,
        coefficient = COEFFICIENT_DEFAULT;

    document.getElementById("property-tax-area").value = document.getElementById("area").value;
    document.getElementById("property-tax-label").textContent = isHouse ? "Zastavěná plocha" : "Podlahová plocha";
    document.getElementById("property-tax-description").textContent = isHouse ? "Výměra půdorysu nadzemní části stavby. Tedy to, co je zobrazeno v katastrální mapě." : "Užitná plocha plus příčky.";

    if (isDisplayed && isHouse) {
        storeys.removeAttribute("hidden");
    } else {
        storeys.setAttribute("hidden", "");
    }

    if (location.startsWith("Praha ")) {
        coefficient = COEFFICIENT_PRAGUE;
    } else if (location === "Brno-město") {
        coefficient = COEFFICIENT_BRNO;
    }

    document.getElementById("property-tax-coefficient").value = coefficient.toFixed(1);

    calculatePropertyTax();
}

function showPropertyTaxCalculation() {
    let isHouse = document.getElementById("type").value === "house";

    document.getElementById("show-property-tax-calculation").parentNode.setAttribute("hidden", "");
    document.getElementById("property-tax-label").parentNode.removeAttribute("hidden");

    ["", "-local", "-inflation"].forEach(function(suffix) {
        document.getElementById(`property-tax-coefficient${suffix}`).parentNode.removeAttribute("hidden");
    });

    if (isHouse) {
        document.getElementById("property-tax-storeys").parentNode.removeAttribute("hidden");
    }
}

function calculateProfitability() {
    calculateIncomeTax();

    let isRental = document.getElementById("purpose").value === "rental",
        buyingPrice = parseInt(document.getElementById("buying-price").value.replaceAll("\xa0", ""), 10) || 0,
        buyingPriceIncrease = parseInt(document.getElementById("buying-price-increase").value, 10) || 0,
        rentingPrice = parseInt(document.getElementById("renting-price").value.replaceAll("\xa0", ""), 10) || 0,
        rentingPriceIncrease = parseInt(document.getElementById("renting-price-increase").value, 10) || 0,
        commission = parseInt(document.getElementById("commission").value.replaceAll("\xa0", ""), 10) || 0,
        depreciationRate = parseFloat(document.getElementById("depreciation").value) || 0,
        opportunityRate = parseFloat(document.getElementById("opportunity-costs").value),
        duration = parseInt(document.getElementById("duration").value, 10) || 0,
        downpayment = parseInt(document.getElementById("downpayment").value.replaceAll("\xa0", ""), 10) || 0,
        insurance = parseInt(document.getElementById("insurance").value.replaceAll("\xa0", ""), 10) || 0,
        hoa = parseInt(document.getElementById("hoa").value.replaceAll("\xa0", ""), 10) || 0,
        propertyTax = parseInt(document.getElementById("property-tax").value.replaceAll("\xa0", ""), 10) || 0,
        annualTax = parseInt(document.getElementById("annual-tax").textContent.replaceAll("\xa0", ""), 10) || 0,
        saleTax = parseInt(document.getElementById("sale-tax").textContent.replaceAll("\xa0", ""), 10) || 0,
        interests = calculateInterests(duration),
        renting = isRental ? 0 : commission,
        buying = 0,
        opportunityCosts = downpayment * (Math.pow(1 + opportunityRate / 100, duration) - 1),
        increasedPrice;

    interests.forEach(function(interest, i) {
        increasedPrice = buyingPrice * Math.pow(1 + buyingPriceIncrease / 100, (i + 1));

        let rent = Math.round(rentingPrice * Math.pow(1 + rentingPriceIncrease / 100, i)) * 12 * (isRental ? (1 - INCOME_TAX) : 1),
            depreciation = depreciationRate / 100 * increasedPrice,
            costs = interest + depreciation + insurance + hoa + propertyTax + annualTax;

        renting += rent;
        buying += costs;

        if (rent < costs) {
            opportunityCosts += (costs - rent) * (Math.pow(1 + opportunityRate / 100, duration - i) - 1);
        }
    });

    if (duration < TAXABLE_INVESTMENT_YEARS) {
        opportunityCosts *= 1 - INCOME_TAX;
    }

    let option,
        rentText,
        profit = increasedPrice - buyingPrice - saleTax,
        shouldBuy = renting - buying + profit > opportunityCosts;

    if (isRental) {
        option = shouldBuy ? "koupit a pronajímat nemovitost" : "investovat jinam";
        rentText = "Výnosy z pronájmu po zdanění";
    } else {
        option = shouldBuy ? "koupit nemovitost" : "jít do pronájmu";
        rentText = "Zaplaceno za nájemné";
    }

    document.getElementById("result").textContent = `V tomto případě se více vyplatí ${option}.`;
    document.getElementById("result-renting-text").textContent = rentText;
    document.getElementById("result-renting").textContent = formatNumber(Math.round(renting));
    document.getElementById("result-buying").textContent = formatNumber(Math.round(profit));
    document.getElementById("result-costs").textContent = formatNumber(Math.round(buying));
    document.getElementById("result-opportunity-costs").textContent = formatNumber(Math.round(opportunityCosts));
}

function calculateInterests(years) {
    let mortgage = parseInt(document.getElementById("mortgage").textContent.replaceAll("\xa0", ""), 10) || 0,
        payment = parseInt(document.getElementById("payment").textContent.replaceAll("\xa0", ""), 10) || 0,
        monthlyRate = parseFloat(document.getElementById("interest-rate").value) / (100 * 12),
        interests = [];

    for (let i = 0; i < years; i++) {
        let interest = 0;

        for (let j = 0; j < 12; j++) {
            let interestPaid = mortgage * monthlyRate;
            interest += interestPaid;

            if (payment < mortgage) {
                mortgage -= payment - interestPaid;
            } else {
                mortgage = 0;
            }
        }

        interests.push(Math.max(interest, 0));
    }

    return interests;
}

function calculateIncomeTax() {
    let isRental = document.getElementById("purpose").value === "rental",
        minDuration = isRental ? 10 : 2,
        duration = parseInt(document.getElementById("duration").value, 10) || 0,
        buyingPrice = parseInt(document.getElementById("buying-price").value.replaceAll("\xa0", ""), 10) || 0,
        buyingPriceIncrease = parseInt(document.getElementById("buying-price-increase").value, 10) || 0,
        rentingPrice = parseInt(document.getElementById("renting-price").value.replaceAll("\xa0", ""), 10) || 0,
        rentingPriceIncrease = parseInt(document.getElementById("renting-price-increase").value, 10) || 0,
        monthlyRate = parseFloat(document.getElementById("interest-rate").value) / (100 * 12),
        isSelfEmployed = document.getElementById("self-employed").checked,
        depreciationRate = parseFloat(document.getElementById("depreciation").value) || 0,
        annualTax = 0,
        saleTax = 0,
        totalExpenses = 0,
        totalRealExpenses = 0;

    if (isRental) {
        let residualPrice = buyingPrice,
            interests = calculateInterests(duration),
            hoa = parseInt(document.getElementById("hoa").value.replaceAll("\xa0", ""), 10) || 0,
            insurance = parseInt(document.getElementById("insurance").value.replaceAll("\xa0", ""), 10) || 0,
            propertyTax = parseInt(document.getElementById("property-tax").value.replaceAll("\xa0", ""), 10) || 0,
            allowableDepreciation = parseInt(document.getElementById("allowable-depreciation").value.replaceAll("\xa0", ""), 10) || 0;

        for (let i = 0; i < duration; i++) {
            let income = Math.round(rentingPrice * Math.pow(1 + rentingPriceIncrease / 100, i)) * 12,
                expenses = Math.min(income * EXPENSES_RATE, EXPENSES_CEILING * EXPENSES_RATE),
                writeOff = Math.ceil((i ? 2 : 1) * residualPrice / (WRITE_OFF_YEARS - (i ? i - 1 : 0)));

            if (residualPrice > writeOff) {
                residualPrice -= writeOff;
            } else {
                writeOff = residualPrice;
                residualPrice = 0;
            }

            let realExpenses = writeOff + interests[i] + 12 * hoa + insurance + propertyTax + allowableDepreciation;
            totalExpenses += expenses;
            totalRealExpenses += realExpenses;

            if (realExpenses > expenses) {
                expenses = realExpenses;
            }

            if (income > expenses || isSelfEmployed) {
                annualTax += INCOME_TAX * (income - expenses);
            }
        }

        annualTax /= duration;
    } else if (monthlyRate) {
        calculateInterests(duration).forEach(function(interest) {
            annualTax -= INCOME_TAX * Math.min(interest, MORTGAGE_CEILING);
        });
        annualTax /= duration;
    }

    document.getElementById("depreciation-costs").textContent = formatNumber(
        Math.round(depreciationRate / 100 * buyingPrice * (1 + Math.pow(1 + buyingPriceIncrease / 100, duration)) / 2)
    );

    document.getElementById("expenses").textContent = formatNumber(Math.round(totalExpenses / duration));
    document.getElementById("real-expenses").textContent = formatNumber(Math.round(totalRealExpenses / duration));
    document.getElementById("annual-tax").textContent = formatNumber(Math.round(annualTax));

    if (duration < minDuration && buyingPriceIncrease > 0) {
        saleTax = INCOME_TAX * buyingPrice * (Math.pow(1 + buyingPriceIncrease / 100, duration) - 1);
    }

    document.getElementById("sale-tax").textContent = formatNumber(saleTax);
}

document.addEventListener("DOMContentLoaded", async function() {
    let date = new Date().toISOString().split("T")[0],
        response = await fetch(`./prices.json?${date}`);

    prices = await response.json();
    fillLocations();
    setPrice();

    let typeInput = document.getElementById("type"),
        areaInput = document.getElementById("area"),
        locationInput = document.getElementById("location");

    typeInput.addEventListener("change", setPrice);
    locationInput.addEventListener("change", setPrice);
    areaInput.addEventListener("change", setPrice);

    [
        "buying-price",
        "renting-price",
        "commission",
        "downpayment",
        "insurance",
        "hoa",
        "property-tax",
        "allowable-depreciation"
    ].forEach(function(identifier) {
        let input = document.getElementById(identifier);

        input.addEventListener("focus", function() {
            input.value = input.value.replaceAll("\xa0", "");
        });
        input.addEventListener("blur", function() {
            input.value = input.value.replaceAll("\xa0", "");

            if (parseInt(input.value, 10) >= 0) {
                input.value = formatNumber(input.value);
            } else {
                input.value = "";
            }
        });
    });

    document.getElementById("interest-rate").value = ((prices.interest_rate || 5) + 1).toString();

    estimateCommission();
    calculateMortgage();
    estimateInsurance();
    estimateHOAPayments();

    typeInput.addEventListener("change", estimateHOAPayments);
    areaInput.addEventListener("change", estimateHOAPayments);

    let priceInput = document.getElementById("buying-price");
    priceInput.addEventListener("change", calculateMortgage);
    priceInput.addEventListener("change", estimateInsurance);

    document.getElementById("renting-price").addEventListener("change", estimateCommission);

    document.getElementById("ltv").addEventListener("change", calculateMortgage);
    document.getElementById("interest-rate").addEventListener("change", calculateMortgage);
    document.getElementById("maturity").addEventListener("change", calculateMortgage);
    document.getElementById("downpayment").addEventListener("change", calculateLTV);

    setPropertyTax();
    typeInput.addEventListener("change", setPropertyTax);
    locationInput.addEventListener("change", setPropertyTax);
    areaInput.addEventListener("change", setPropertyTax);

    [
        "property-tax-area",
        "property-tax-storeys",
        "property-tax-coefficient",
        "property-tax-coefficient-local",
        "property-tax-coefficient-inflation",
    ].forEach(function(identifier) {
        document.getElementById(identifier).addEventListener("change", calculatePropertyTax);
    });

    document.getElementById("show-property-tax-calculation").addEventListener("click", showPropertyTaxCalculation);

    [
        "buying-price-increase",
        "renting-price",
        "renting-price-increase",
        "commission",
        "depreciation",
        "opportunity-costs",
        "hoa",
        "property-tax",
        "duration",
        "purpose",
        "allowable-depreciation",
        "self-employed"
    ].forEach(function(identifier) {
        document.getElementById(identifier).addEventListener("change", calculateProfitability);
    });
});

let prices,
    chart,
    blank;
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
    MAINTENANCE_DEFAULT = 0.1,
    MAINTENANCE_CEILING = 80000,
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

function getNumber(identifier, isText) {
    let parent = isText ? "textContent" : "value";
    return parseInt(document.getElementById(identifier)[parent].replaceAll("\xa0", ""), 10) || 0;
}

function formatNumber(number) {
    return Math.trunc(number).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\xa0");
}

function formatPercent(number) {
    return Math.abs(number).toString().replace(".", ",") + " %";
}

function estimatePrice(ppsmRef, area, alpha) {
    let condition = parseInt(document.getElementById("condition").value) || 0;
    return ppsmRef * Math.max(MIN_FACTOR, Math.min(MAX_FACTOR, Math.pow(area / REF_SIZE, -alpha))) * area * (1 + condition / 100);
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
    let price = getNumber("renting-price");
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
    let price = getNumber("buying-price"),
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
    let price = getNumber("buying-price"),
        downpayment = getNumber("downpayment"),
        mortgage = price - downpayment;

    document.getElementById("ltv").value = (mortgage / price * 100).toFixed(3);
    calculatePayments(mortgage);
}

function estimateMaintenance() {
    let price = getNumber("buying-price"),
        type = document.getElementById("type").value,
        maintenance = (type == "apartment" ? 1 : 2) * MAINTENANCE_DEFAULT;

    document.getElementById("maintenance").value = maintenance;
    document.getElementById("maintenance-costs").textContent = formatNumber(price * maintenance / 100);
}

function estimateInsurance() {
    let price = getNumber("buying-price"),
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

function getRenovations(year) {
    let conditions = document.getElementById("condition").options,
        renovationFrequency = parseInt(document.getElementById("renovation-frequency").value, 10) || 0,
        renovationYear = 0,
        renovations = [];

    for (let i = 0; i < conditions.length; i++) {
        if (conditions[i].selected) {
            renovationYear = Math.round((conditions.length - i - 1) * renovationFrequency / (conditions.length - 1));
            break;
        }
    }

    while (renovationFrequency && renovationYear <= year) {
        renovations.push(renovationYear);
        renovationYear += renovationFrequency;
    }

    return renovations;
}

function getDeteriorationRate(conditions) {
    let renovationFrequency = parseInt(document.getElementById("renovation-frequency").value, 10) || 0;
    return (conditions.length - 1) * (parseInt(conditions[conditions.length - 1].value) || 0) / renovationFrequency;
}

function getPriceProgress(duration) {
    let buyingPrice = getNumber("buying-price"),
        buyingPriceIncrease = parseInt(document.getElementById("buying-price-increase").value, 10) || 0,
        conditions = document.getElementById("condition").options,
        renovationBonus = parseInt(conditions[0].value) || 0,
        deteriorationRate = getDeteriorationRate(conditions),
        renovations = getRenovations(duration),
        renovationCosts = parseFloat(document.getElementById("renovation-costs").value) || 0,
        price = buyingPrice,
        progress = [buyingPrice];

    for (let i = 0; i < duration; i++) {
        price *= 1 + buyingPriceIncrease / 100;

        if (renovations.includes(i)) {
            price *= 1 + (renovationBonus + renovationCosts) / 100;
        } else {
            price *= 1 + deteriorationRate / 100;
        }

        progress.push(price);
    }

    return progress;
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
        rentingPrice = getNumber("renting-price"),
        rentingPriceIncrease = parseInt(document.getElementById("renting-price-increase").value, 10) || 0,
        commission = getNumber("commission"),
        opportunityRate = parseFloat(document.getElementById("opportunity-costs").value),
        duration = parseInt(document.getElementById("duration").value, 10) || 0,
        priceProgress = getPriceProgress(duration),
        downpayment = getNumber("downpayment"),
        insurance = getNumber("insurance"),
        hoa = getNumber("hoa"),
        propertyTax = getNumber("property-tax"),
        annualTax = getNumber("annual-tax", true),
        saleTax = getNumber("sale-tax", true),
        payment = getNumber("payment", true) * 12,
        interests = calculateInterests(duration),
        maintenance = parseFloat(document.getElementById("maintenance").value),
        renovations = getRenovations(duration),
        renovationCosts = parseFloat(document.getElementById("renovation-costs").value) || 0,
        renting = [downpayment],
        buying = [downpayment],
        investment = downpayment,
        equity = downpayment,
        rentingCosts = 0,
        buyingCosts = 0,
        opportunityCosts = 0,
        extra = 0,
        increasedPrice = priceProgress[0],
        remainingMortgage = getNumber("mortgage", true),
        increments = [];

    interests.forEach(function(interest, i) {
        let rent = Math.round(rentingPrice * Math.pow(1 + rentingPriceIncrease / 100, i)) * 12 * (isRental ? (1 - INCOME_TAX) : 1),
            costs = interest + priceProgress[i] * maintenance / 100 + insurance + hoa + propertyTax + annualTax,
            growth = priceProgress[i + 1] - priceProgress[i],
            increment = investment * opportunityRate / 100;

        if (renovations.includes(i)) {
            costs += priceProgress[i] * renovationCosts / 100;
        }

        if (remainingMortgage > 0) {
            remainingMortgage -= payment;
            growth += payment;
        } else {
            remainingMortgage = 0;
        }

        let compensation;

        if (isRental) {
            compensation = costs > growth ? costs - growth : 0;
            investment += increment + costs + compensation;
            equity += growth - costs + compensation + rent;
        } else {
            if (!i) {
                rent += commission;
            }

            compensation = rent > costs ? rent - costs : 0;
            investment += increment + costs - rent + compensation;
            equity += growth - costs + compensation + extra * opportunityRate / 100;
            extra += compensation;
        }

        opportunityCosts += increment;
        increasedPrice += growth;
        rentingCosts += rent;
        buyingCosts += costs;

        renting.push(Math.round(investment));
        buying.push(Math.round(equity));
        increments.push(increment);
    });

    let investmentTax = increments.slice(-TAXABLE_INVESTMENT_YEARS).reduce(
        (acc, x) => acc + x * INCOME_TAX, 0
    );
    opportunityCosts -= investmentTax;
    renting[renting.length - 1] -= Math.round(investmentTax);

    buyingCosts += saleTax;
    buying[buying.length - 1] -= Math.round(saleTax);

    let options,
        rentText;

    if (isRental) {
        options = ["investovat jinam", "koupit a pronajímat nemovitost"];
        rentText = "Výnosy z pronájmu po zdanění";
    } else {
        options = ["jít do pronájmu", "koupit nemovitost"];
        rentText = "Zaplaceno za nájemné";
    }

    if (chart) {
        chart.destroy();
    }

    let annotations = {};

    renovations.forEach(function(renovation, i) {
        annotations[`line${i + 1}`] = {
            type: "box",
            scaleID: "x",
            xMin: renovation,
            xMax: renovation + 1,
            backgroundColor: "rgba(0, 0, 0, 0.1)",
            label: {
                content: "rekonstrukce",
                display: true,
                rotation: 90
            }
        };
    });

    chart = new Chart(
        document.getElementById("chart"),
        {
            type: "line",
            data: {
                labels: Array.from({length: duration + 1}, (_, i) => i),
                datasets: [
                    {
                        label: `Varianta: ${options[0]}`,
                        data: renting
                    },
                    {
                        label: `Varianta: ${options[1]}`,
                        data: buying
                    },
                ]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: "Vývoj čistého jmění v jednotlivých letech"
                    },
                    tooltip: {
                        callbacks: {
                            title: tooltipItems => `Čisté jmění v roce ${tooltipItems[0].label}`
                        }
                    },
                    annotation: {
                        annotations
                    }
                }
            }
        }
    );

    let canvas = document.createElement("canvas");
    canvas.width = chart.canvas.width;
    canvas.height = chart.canvas.height;
    blank = canvas.toDataURL();

    let option = options[Number(buying[buying.length - 1] > renting[renting.length - 1])]

    document.getElementById("result").textContent = `V tomto případě se více vyplatí ${option}.`;
    document.getElementById("result-renting-text").textContent = rentText;
    document.getElementById("result-renting").textContent = formatNumber(Math.round(rentingCosts));
    document.getElementById("result-increased-price").textContent = formatNumber(Math.round(increasedPrice));
    document.getElementById("result-selling-profit").textContent = formatNumber(Math.round(increasedPrice - priceProgress[0] - saleTax));
    document.getElementById("result-costs").textContent = formatNumber(Math.round(buyingCosts));
    document.getElementById("result-opportunity-costs").textContent = formatNumber(Math.round(opportunityCosts));
}

function calculateInterests(years) {
    let mortgage = getNumber("mortgage", true),
        payment = getNumber("payment", true),
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
        priceProgress = getPriceProgress(duration),
        rentingPrice = getNumber("renting-price"),
        rentingPriceIncrease = parseInt(document.getElementById("renting-price-increase").value, 10) || 0,
        renovationCosts = parseFloat(document.getElementById("renovation-costs").value) || 0,
        monthlyRate = parseFloat(document.getElementById("interest-rate").value) / (100 * 12),
        isSelfEmployed = document.getElementById("self-employed").checked,
        annualTax = 0,
        saleTax = 0,
        totalExpenses = 0,
        totalRealExpenses = 0;

    if (isRental) {
        let residualPrice = priceProgress[0],
            interests = calculateInterests(duration),
            hoa = getNumber("hoa"),
            insurance = getNumber("insurance"),
            propertyTax = getNumber("property-tax"),
            renovations = getRenovations(duration),
            maintenance = parseFloat(document.getElementById("maintenance").value);

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

            if (renovations.includes(i)) {
                residualPrice += priceProgress[i] * renovationCosts / 100;
            }

            let realExpenses = writeOff + interests[i] + 12 * hoa + insurance + propertyTax + Math.min(priceProgress[i] * maintenance / 100, MAINTENANCE_CEILING);
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

    document.getElementById("expenses").textContent = formatNumber(Math.round(totalExpenses / duration));
    document.getElementById("real-expenses").textContent = formatNumber(Math.round(totalRealExpenses / duration));
    document.getElementById("annual-tax").textContent = formatNumber(Math.round(annualTax));

    if (duration < minDuration) {
        saleTax = INCOME_TAX * Math.max(priceProgress[duration - 1] - priceProgress[0], 0);
    }

    document.getElementById("sale-tax").textContent = formatNumber(saleTax);
}

document.addEventListener("DOMContentLoaded", async function() {
    let date = new Date().toISOString().split("T")[0],
        response = await fetch(`./prices.json?${date}`);

    prices = await response.json();
    fillLocations();
    setPrice();
    estimateMaintenance();

    let typeInput = document.getElementById("type"),
        areaInput = document.getElementById("area"),
        locationInput = document.getElementById("location");

    typeInput.addEventListener("change", setPrice);
    typeInput.addEventListener("change", estimateMaintenance);
    locationInput.addEventListener("change", setPrice);
    areaInput.addEventListener("change", setPrice);
    document.getElementById("condition").addEventListener("change", setPrice);

    [
        "buying-price",
        "renting-price",
        "commission",
        "downpayment",
        "insurance",
        "hoa",
        "property-tax",
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
        "opportunity-costs",
        "hoa",
        "maintenance",
        "renovation-frequency",
        "renovation-costs",
        "property-tax",
        "duration",
        "purpose",
        "self-employed"
    ].forEach(function(identifier) {
        document.getElementById(identifier).addEventListener("change", calculateProfitability);
    });

    let scrollTimeout;

    window.addEventListener("scroll", () => {
        clearTimeout(scrollTimeout);

        scrollTimeout = setTimeout(() => {
            // fixing an annoying state in which the chart is blank
            if (blank === chart.canvas.toDataURL()) {
                chart.render();
            }
        }, 100);
    });
});

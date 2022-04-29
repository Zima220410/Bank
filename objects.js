// Объекты
// 1.	Клиенты банка, имеют такие характеристики - фио, активный или нет, дата регистрации в банке, счета. Существует два типа счетов: дебетовый и кредитовый. Дебитовый счет имеет текущий баланс либо он положителен либо нулевой. Кредитовый счет имеет два баланса: личные средства, кредитные средства и кредитный лимит. У каждого счета есть активность, дата активности когда заканчивается срок годности пластиковой карты. У каждого счета есть тип валюты, UAH, RUB, USD, GBP, EUR и другие. Подсчитать общее количество денег внутри банка в долларовом эквиваленте учитывая кредитные лимиты и снятие средств. Посчитать сколько всего денег в долларовом эквиваленте все клиенты должны банку. Посчитать сколько неактивных клиентов должны погасить кредит банку и на какую общую сумму. Аналогично для активных. Для получения актуальных курсов валют использовать API (которое будет предоставлено). Промисы использовать для работы с API в целях отправки запросов на сервер. Создать отдельный git-репозиторий для этого проекта и дальше работать с этим проектом в этом репозитории.


class BankClient {
    constructor(id, name, isActive) {
        this.id = id;
        this.name = name;
        this.isActive = isActive;
        this.dataRegistrClient = new Date();
        this.debitAccount = [];
        this.creditAccount = [];
    }
    addDebitAccount(currency, expirationDate, isActive, dateLastActivity, balance) {
        this.debitAccount.push(new Account(currency, expirationDate, isActive, dateLastActivity, balance));
    }
    addCreditAccount(currency, expirationDate, isActive, dateLastActivity, balance, creditLimit) {
        this.creditAccount.push(new Account(currency, expirationDate, isActive, dateLastActivity, balance, creditLimit));
    }
}

class Account {
    constructor(currency, expirationDate, isActive, dateLastActivity, balance, creditLimit = null) {
        this.currency = currency;
        this.expirationDate = expirationDate;
        this.isActive = isActive;
        this.dateLastActivity = dateLastActivity;
        this.balance = balance;
        this.creditLimit = creditLimit;
    }
}

let bank = [
    new BankClient(100, 'Alex', true),
    new BankClient(120, 'Den', true),
    new BankClient(140, 'Max', false)
];

function addClient(id, name, isActive) {
    bank.push(new BankClient(id, name, isActive));
}

async function requestExchangeRate() {
    let promise = await fetch('https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5');
    let exchangeObj = await promise.json()
    return exchangeObj;
}

async function bankMoney(arr) {
    let sum = 0;
    await requestExchangeRate().then(res => {
        arr.forEach(client => {
            client.debitAccount.forEach(data => sum += currencyTransfer(data, data.balance, res));
            client.creditAccount.forEach(data => sum += currencyTransfer(data, data.balance, res));
        });
    });
    return sum;
}

function currencyTransfer(data, temp, res, out = 'USD') {
    let result = 0;
    let coef = 1;
    res.forEach(val => {
        if (data.currency === val.ccy) {
            res.forEach(val => {
                if (out === val.ccy) {
                    coef = val.buy;
                }
            });
            result = temp * val.buy / coef;
        } else if (val.base_ccy === data.currency && val.ccy === out) {
            result = temp / val.buy;
        }
    });
    return result;
}

async function bankDebit(arr) {
    let sum = 0;
    await requestExchangeRate().then(res => {
        arr.forEach(client => {
            client.creditAccount.forEach(data => {
                if (data.creditLimit > data.balance) {
                    temp = data.creditLimit - data.balance;
                    sum += currencyTransfer(data, temp, res);
                }
            });
        });
    });
    return sum;
}

async function sumDebitInactiveClients(arr, activityType) {
    let sum = 0;
    let temp = 0;
    await requestExchangeRate().then(res => {
        arr.forEach(client => {
            if (client.isActive === activityType) {
                client.creditAccount.forEach(data => {
                    if ((data.creditLimit - data.balance) < 0) {
                        temp = data.balance - data.creditLimit;
                        sum += currencyTransfer(data, temp, res);
                    }
                });
            }
        });
    });
    return sum;
}

function numbersDebtors(arr, activityType) {
    let count = 0;
    arr.forEach(client => {
        if (client.isActive === activityType) {
            client.creditAccount.forEach(data => {
                if ((data.creditLimit - data.balance) < 0) {
                    count++;
                }
            });
        }
    });
    return count;
}
// Объекты
// 1.	Клиенты банка, имеют такие характеристики - фио, активный или нет, дата регистрации в банке, счета. Существует два типа счетов: дебетовый и кредитовый. Дебитовый счет имеет текущий баланс либо он положителен либо нулевой. Кредитовый счет имеет два баланса: личные средства, кредитные средства и кредитный лимит. У каждого счета есть активность, дата активности когда заканчивается срок годности пластиковой карты. У каждого счета есть тип валюты, UAH, RUB, USD, GBP, EUR и другие. Подсчитать общее количество денег внутри банка в долларовом эквиваленте учитывая кредитные лимиты и снятие средств. Посчитать сколько всего денег в долларовом эквиваленте все клиенты должны банку. Посчитать сколько неактивных клиентов должны погасить кредит банку и на какую общую сумму. Аналогично для активных. Для получения актуальных курсов валют использовать API (которое будет предоставлено). Промисы использовать для работы с API в целях отправки запросов на сервер. Создать отдельный git-репозиторий для этого проекта и дальше работать с этим проектом в этом репозитории.

class BankClient {
    constructor(id, name, isActive) {
        this.id = id;
        this.name = name;
        this.isActive = isActive;
        this.dataRegistrClient = new Date();
        this.debitAccounts = [];
        this.creditAccounts = [];
    }
    addDebitAccount(currency, expirationDate, isActive, dateLastActivity, balance) {
        this.debitAccounts.push(new Account(currency, expirationDate, isActive, dateLastActivity, balance));
    }
    addCreditAccount(currency, expirationDate, isActive, dateLastActivity, balance, creditLimit) {
        this.creditAccounts.push(new Account(currency, expirationDate, isActive, dateLastActivity, balance, creditLimit));
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

async function bankMoney(arrayBankCustomers) {
    let sum = 0;
    await requestExchangeRate().then(exchangeRates => {
        arrayBankCustomers.forEach(client => {
            [...client.creditAccounts, ...client.debitAccounts].forEach(account => sum += currencyConversion(account, account.balance, exchangeRates));
        });
    });
    return sum;
}

async function bankDebit(arrayBankCustomers) {
    let sum = 0;
    let debtBalance = 0;
    await requestExchangeRate().then(exchangeRates => {
        arrayBankCustomers.forEach(client => {
            client.creditAccounts.forEach(account => {
                if (account.creditLimit > account.balance) {
                    debtBalance = account.creditLimit - account.balance;
                    sum += currencyConversion(account, debtBalance, exchangeRates);
                }
            });
        });
    });
    return sum;
}

function numbersDebtors(arrayBankCustomers, activityType) {
    let count = 0;
    arrayBankCustomers.forEach(client => {
        if (client.isActive === activityType) {
            client.creditAccounts.forEach(account => {
                if ((account.creditLimit - account.balance) < 0) {
                    count++;
                }
            });
        }
    });
    return count;
}

async function sumDebitInactiveClients(arrayBankCustomers, activityType) {
    let sum = 0;
    let debtBalance = 0;
    await requestExchangeRate().then(exchangeRates => {
        arrayBankCustomers.forEach(client => {
            if (client.isActive === activityType) {
                client.creditAccounts.forEach(account => {
                    if ((account.creditLimit - account.balance) < 0) {
                        debtBalance = account.balance - account.creditLimit;
                        sum += currencyConversion(account, debtBalance, exchangeRates);
                    }
                });
            }
        });
    });
    return sum;
}

async function requestExchangeRate() {
    let promise = await fetch('https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5');
    let exchangeObj = await promise.json();
    return exchangeObj;
}

function currencyConversion(account, balance, exchangeRates, out) {
    let result = 0;
    let coef = 1;
    out = out || 'USD';
    exchangeRates.forEach(eachCurrency => {
        if (account.currency === eachCurrency.ccy) {
            exchangeRates.forEach(eachCurrency => {
                if (out === eachCurrency.ccy) {
                    coef = eachCurrency.buy;
                }
            });
            result = balance * eachCurrency.buy / coef;
        } else if (eachCurrency.base_ccy === account.currency && eachCurrency.ccy === out) {
            result = balance / eachCurrency.buy;
        }
    });
    return result;
}
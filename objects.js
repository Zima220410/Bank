// Объекты
// 1.	Клиенты банка, имеют такие характеристики - фио, активный или нет, дата регистрации в банке, счета. Существует два типа счетов: дебетовый и кредитовый. Дебитовый счет имеет текущий баланс либо он положителен либо нулевой. Кредитовый счет имеет два баланса: личные средства, кредитные средства и кредитный лимит. У каждого счета есть активность, дата активности когда заканчивается срок годности пластиковой карты. У каждого счета есть тип валюты, UAH, RUB, USD, GBP, EUR и другие. Подсчитать общее количество денег внутри банка в долларовом эквиваленте учитывая кредитные лимиты и снятие средств. Посчитать сколько всего денег в долларовом эквиваленте все клиенты должны банку. Посчитать сколько неактивных клиентов должны погасить кредит банку и на какую общую сумму. Аналогично для активных. Для получения актуальных курсов валют использовать API (которое будет предоставлено). Промисы использовать для работы с API в целях отправки запросов на сервер. Создать отдельный git-репозиторий для этого проекта и дальше работать с этим проектом в этом репозитории.

class BankClient {
    constructor(id, name, isActive, debitAccount, creditAccount, creditLimit) {
        this.id = id;
        this.name = name;
        this.isActive = isActive;
        this.dataRegistr = new Date();
        this.debitAccount = debitAccount;
        this.creditAccount = creditAccount;
        this.creditLimit = creditLimit;
    }
}

let bank = [
    new BankClient(100, 'Alex', true, 1000, 1000, 5000),
    new BankClient(120, 'Den', true, 500, -1000, 3000),
    new BankClient(140, 'Max', false, 0, -2000, 4000)
];

function conversionUAH_USD(data) {
    fetch('https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5')
        .then(res => res.json())
        .then(res => console.log((data / (res[0].buy)).toFixed(2)));
}

function bankMoney(arr) {
    let sum = 0;
    arr.forEach(client => sum += client.debitAccount + client.creditAccount + client.creditLimit);
    return conversionUAH_USD(sum);
}

function bankDebit(arr) {
    let sum = 0;
    arr.forEach(client => {
        if (client.creditAccount < 0) {
            sum += client.creditAccount;
        }
    });
    return conversionUAH_USD(-sum);
}

function numbersInactiveDebtors(arr) {
    let count = 0;
    arr.forEach(client => {
        if (!client.isActive && client.creditAccount < 0) {
            count++;
        }
    });
    return count;
}

function sumDebitInactiveClients(arr) {
    let sum = 0;
    arr.forEach(client => {
        if (!client.isActive && client.creditAccount < 0) {
            sum += client.creditAccount;
        }
    });
    return -sum;
}
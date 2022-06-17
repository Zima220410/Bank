// Объекты
// 1.	Клиенты банка, имеют такие характеристики - фио, активный или нет, дата регистрации в банке, счета. Существует два типа счетов: дебетовый и кредитовый. Дебитовый счет имеет текущий баланс либо он положителен либо нулевой. Кредитовый счет имеет два баланса: личные средства, кредитные средства и кредитный лимит. У каждого счета есть активность, дата активности когда заканчивается срок годности пластиковой карты. У каждого счета есть тип валюты, UAH, RUB, USD, GBP, EUR и другие. Подсчитать общее количество денег внутри банка в долларовом эквиваленте учитывая кредитные лимиты и снятие средств. Посчитать сколько всего денег в долларовом эквиваленте все клиенты должны банку. Посчитать сколько неактивных клиентов должны погасить кредит банку и на какую общую сумму. Аналогично для активных. Для получения актуальных курсов валют использовать API (которое будет предоставлено). Промисы использовать для работы с API в целях отправки запросов на сервер. Создать отдельный git-репозиторий для этого проекта и дальше работать с этим проектом в этом репозитории.
// 2.	Вывести задания из раздела “Объекты” в HTML на страницу браузера. Создать формы добавления новых элементов, реализовать возможность удаления и изменения данных.
'use strict';

class BankClient {
    constructor(id, name, isActive, dataRegistrClient, debitAccounts, creditAccounts) {
        this.id = id;
        this.name = name;
        this.isActive = isActive;
        this.dataRegistrClient = new Date();
        this.accounts = [];
    }

    addAccount(currency, balance, creditLimit, billIsDebit) {
        this.accounts.push(new Account(currency, balance, creditLimit, billIsDebit));
    }
}

class Account {
    constructor(currency, balance, creditLimit = 0, billIsDebit) {
        this.currency = currency;
        this.balance = balance;
        this.creditLimit = creditLimit;
        this.billIsDebit = billIsDebit;
    }
}

class Bank {
    constructor() {
        this.clients = [];
        this.totalResult = document.querySelector('.total_result');
        this.resultAccount = document.querySelector('.res_credit_account');
    }

    addClient(id, name, isActive) {
        this.clients.push(new BankClient(id, name, isActive));
    }

    async calculateBankMoney(customers) {
        let sum = 0;
        await this.requestExchangeRate().then(exchangeRates => {
            customers.forEach(client => {
                client.accounts.forEach(account => sum += this.currencyConversion(account, account.balance, exchangeRates))
            });
        });
        this.totalResult.innerHTML = sum.toFixed(2);
    }

    async calculareBankDebit(customers) {
        let sum = 0;
        let debtBalance = 0;
        await this.requestExchangeRate().then(exchangeRates => {
            customers.forEach(client => {
                client.accounts.forEach(account => {
                    if (account.creditLimit > account.balance && account.billIsDebit === false) {
                        debtBalance = account.creditLimit - account.balance;
                        sum += this.currencyConversion(account, debtBalance, exchangeRates);
                    }
                });
            });
        });
        this.totalResult.innerHTML = sum.toFixed(2);
    }

    countingNumberDebtors(customers, activityType) {
        let count = 0;
        customers.forEach(client => {
            if (client.isActive === activityType) {
                client.accounts.forEach(account => {
                    if (account.balance - account.creditLimit < 0 && account.billIsDebit === false) {
                        count++;
                    }
                });
            }
        });
        this.totalResult.innerHTML = count;
    }

    async sumDebitInactiveClients(customers, activityType) {
        let sum = 0;
        let debtBalance = 0;
        await this.requestExchangeRate().then(exchangeRates => {
            customers.forEach(client => {
                if (client.isActive === activityType) {
                    client.accounts.forEach(account => {
                        if ((account.balance - account.creditLimit) < 0 && account.billIsDebit === false) {
                            debtBalance = account.creditLimit - account.balance;
                            sum += this.currencyConversion(account, debtBalance, exchangeRates);
                        }
                    });
                }
            });
        });
        this.totalResult.innerHTML = sum.toFixed(2);
    }

    async requestExchangeRate() {
        let promise = await fetch('https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5');
        return await promise.json();
    }

    currencyConversion(account, balance, exchangeRates, out) {
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

    addNewClient() {
        let addId = document.querySelector('.add_id_client');
        let addName = document.querySelector('.add_name_client');
        let addIsActive = document.querySelector('.add_isactive');
        let resultAdding = document.querySelector('.res_adding');
        let newClient = true;
        let viewInfoClient;
        this.clients.forEach(client => {
            if (client.id === addId.value) {
                newClient = false;
            }
        });
        if (newClient) {
            if (/^[0-9]+$/.test(addId.value) && /^[a-z\s]+$/i.test(addName.value)) {
                this.addClient(addId.value, addName.value, addIsActive.checked);
                viewInfoClient = `ID - ${addId.value} , Name - ${addName.value} , isActive - ${addIsActive.checked}`;
            } else {
                viewInfoClient = 'Данные для ввода не корректны';
            }
        } else {
            viewInfoClient = 'Этот клиент уже внесен!';
        }
        return resultAdding.innerHTML = viewInfoClient,
            this.resultAccount.innerHTML = '';
    }

    addNewAccount() {
        let addCurrency = document.querySelector('.add_currency');
        let addBalance = document.querySelector('.add_balance');
        let addCreditLimit = document.querySelector('.add_credit_limit');
        let addIsDebitBill = document.querySelector('.add_isdebit_bill');
        let balance = +addBalance.value;
        let creditLimit = +addCreditLimit.value;
        if (addIsDebitBill.checked === true) {
            creditLimit = 0;
        }
        if (/[\d]+/.test(balance) && /[\d]+/.test(creditLimit) && this.clients.length > 0) {
            this.clients[this.clients.length - 1].addAccount(addCurrency.value, balance, creditLimit, addIsDebitBill.checked);
            this.resultAccount.innerHTML = `Счет в ${addCurrency.value} на сумму ${balance} с лимитом ${creditLimit} (дебетовый - ${addIsDebitBill.checked})`;
        } else {
            this.resultAccount.innerHTML = 'Данные для ввода не корректны';
        }
    }

    findClient() {
        let idFind = document.querySelector('.find_id');
        let resultFinding = document.querySelector('.res_finding');
        let resultFindingAccounts = document.querySelector('.res_finding_accounts');
        resultFinding.innerHTML = 'Не является клиентом банка';
        resultFindingAccounts.innerHTML = '';
        for (let i = 0; i < this.clients.length; i++) {
            if (this.clients[i].id === idFind.value) {
                resultFinding.innerHTML = `ID - ${this.clients[i].id} , Name - ${this.clients[i].name} , isActive - ${this.clients[i].isActive}`;
                this.clients[i].accounts.forEach(account => {
                    resultFindingAccounts.innerHTML += 
                        `<div> - в ${account.currency} на сумму ${account.balance} с лимитом ${account.creditLimit}</div>`;
                });
            }
        }
    }

    deleteClient() {
        let idDelete = document.querySelector('.del_id');
        for (let i = 0; i < this.clients.length; i++) {
            if (this.clients[i].id === idDelete.value) {
                this.clients.splice(i, 1);
            }
        }
    }
}

let bank = new Bank();

document.querySelector('.add_client').addEventListener('submit', (event) => {
    event.preventDefault();
    bank.addNewClient();
    event.target.reset();
});

document.querySelector('.add_account').addEventListener('submit', (event) => {
    event.preventDefault();
    bank.addNewAccount();
    event.target.reset();
});

document.querySelector('.find').addEventListener('submit', (event) => {
    event.preventDefault();
    bank.findClient();
    event.target.reset();
});

document.querySelector('.delete').addEventListener('submit', (event) => {
    event.preventDefault();
    bank.deleteClient();
    event.target.reset();
});

document.querySelector('#sum').addEventListener('click', function () {
    bank.calculateBankMoney(bank.clients);
});

document.querySelector('#deb_sum').addEventListener('click', function () {
    bank.calculareBankDebit(bank.clients);
});

document.querySelector('#num_deb').addEventListener('click', function () {
    bank.countingNumberDebtors(bank.clients, false);
});

document.querySelector('#sum_deb_act_clients').addEventListener('click', function () {
    bank.sumDebitInactiveClients(bank.clients, false);
});

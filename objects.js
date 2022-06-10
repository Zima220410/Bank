// Объекты
// 1.	Клиенты банка, имеют такие характеристики - фио, активный или нет, дата регистрации в банке, счета. Существует два типа счетов: дебетовый и кредитовый. Дебитовый счет имеет текущий баланс либо он положителен либо нулевой. Кредитовый счет имеет два баланса: личные средства, кредитные средства и кредитный лимит. У каждого счета есть активность, дата активности когда заканчивается срок годности пластиковой карты. У каждого счета есть тип валюты, UAH, RUB, USD, GBP, EUR и другие. Подсчитать общее количество денег внутри банка в долларовом эквиваленте учитывая кредитные лимиты и снятие средств. Посчитать сколько всего денег в долларовом эквиваленте все клиенты должны банку. Посчитать сколько неактивных клиентов должны погасить кредит банку и на какую общую сумму. Аналогично для активных. Для получения актуальных курсов валют использовать API (которое будет предоставлено). Промисы использовать для работы с API в целях отправки запросов на сервер. Создать отдельный git-репозиторий для этого проекта и дальше работать с этим проектом в этом репозитории.
// 2.	Вывести задания из раздела “Объекты” в HTML на страницу браузера. Создать формы добавления новых элементов, реализовать возможность удаления и изменения данных.
'use strict';

class BankClient {
    constructor(id, name, isActive) {
        this.id = id;
        this.name = name;
        this.isActive = isActive;
        this.dataRegistrClient = new Date();
        this.debitAccounts = [];
        this.creditAccounts = [];
    }

    addDebitAccount(currency, balance) {
        this.debitAccounts.push(new Account(currency, balance));
    }

    addCreditAccount(currency, balance, creditLimit) {
        this.creditAccounts.push(new Account(currency, balance, creditLimit));
    }
}

class Account {
    constructor(currency, balance, creditLimit = 0) {
        this.currency = currency;
        this.balance = balance;
        this.creditLimit = creditLimit;
    }
}

class Bank {
    constructor() {
        this.clients = [];
        this.totalResult = document.querySelector('.total_result');
        this.resultDebAccount = document.querySelector('.res_deb_account');
        this.resultCreditAccount = document.querySelector('.res_credit_account');
    }

    addClient(id, name, isActive) {
        this.clients.push(new BankClient(id, name, isActive));
    }
    
    async calculateBankMoney(customers) {
        let sum = 0;
        await this.requestExchangeRate().then(exchangeRates => {
            customers.forEach(client => {
                [...client.creditAccounts, ...client.debitAccounts].forEach(account => sum += this.currencyConversion(account, account.balance, exchangeRates));
            });
        });
        this.totalResult.innerHTML = sum.toFixed(2);
    }

    async calculareBankDebit(customers) {
        let sum = 0;
        let debtBalance = 0;
        await this.requestExchangeRate().then(exchangeRates => {
            customers.forEach(client => {
                client.creditAccounts.forEach(account => {
                    if (account.creditLimit > account.balance) {
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
                client.creditAccounts.forEach(account => {
                    if ((account.balance - account.creditLimit) < 0) {
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
                    client.creditAccounts.forEach(account => {
                        if ((account.balance - account.creditLimit) < 0) {
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
        this.clients.forEach(client => {
            if (client.id === addId.value) {
                newClient = false;
            }
        });
        if (newClient) {
            if (/^[0-9]+$/.test(addId.value) && /^[a-z\s]+$/i.test(addName.value)) {
                this.addClient(addId.value, addName.value, addIsActive.checked);
                resultAdding.innerHTML = `ID - ${addId.value} , Name - ${addName.value} , isActive - ${addIsActive.checked}`;
                this.clearAddForm();
            } else {
                resultAdding.innerHTML = 'Данные для ввода не корректны';
                this.clearAddForm();
            }
        } else {
            resultAdding.innerHTML = 'Этот клиент уже внесен!';
            this.clearAddForm();
        }
    }

    clearAddForm() {
        this.resultDebAccount.innerHTML = '';
        this.resultCreditAccount.innerHTML = '';
    }

    addNewDebitAccount() {
        let addDebitCurrency = document.querySelector('.add_debit_currency');
        let addDebitBalance = document.querySelector('.add_debit_balance');
        let debitBalance = +addDebitBalance.value;
        if (/[\d]+/.test(debitBalance) && debitBalance > 0 && this.clients.length > 0) {
            this.clients[this.clients.length - 1].addDebitAccount(addDebitCurrency.value, debitBalance);
            this.resultDebAccount.innerHTML = `Дебетовый счет в ${addDebitCurrency.value} на сумму ${debitBalance}`;
        } else {
            this.resultDebAccount.innerHTML = 'Данные для ввода не корректны';
        }
    }

    addNewCreditAccount() {
        let addCreditCurrency = document.querySelector('.add_credit_currency');
        let addCreditBalance = document.querySelector('.add_credit_balance');
        let addCreditLimit = document.querySelector('.add_credit_limit');
        let creditBalance = +addCreditBalance.value;
        let creditLimit = +addCreditLimit.value;
        if (/[\d]+/.test(creditBalance) && /[\d]+/.test(creditLimit) && this.clients.length > 0) {
            this.clients[this.clients.length - 1].addCreditAccount(addCreditCurrency.value, creditBalance, creditLimit);
            this.resultCreditAccount.innerHTML = ` Кредитовый счет в ${addCreditCurrency.value} на сумму ${creditBalance} с лимитом ${creditLimit}`;
        } else {
            this.resultCreditAccount.innerHTML = 'Данные для ввода не корректны';
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
                let consolidationAccounts = this.clients[i].debitAccounts.concat(this.clients[i].creditAccounts);
                consolidationAccounts.forEach(account => {
                    resultFindingAccounts.innerHTML += 
                    `<div> -  в ${account.currency} на сумму ${account.balance} с лимитом ${account.creditLimit}</div>`;
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

document.querySelector('.add_debit_account').addEventListener('submit', (event) => {
    event.preventDefault();
    bank.addNewDebitAccount();
    event.target.reset();
});

document.querySelector('.add_credit_account').addEventListener('submit', (event) => {
    event.preventDefault();
    bank.addNewCreditAccount();
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

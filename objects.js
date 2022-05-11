let addForm = document.querySelector('.add_client');
let addId = document.querySelector('.add_id_client');
let addName = document.querySelector('.add_name_client');
let addIsActive = document.querySelector('.add_isactive');
let findForm = document.querySelector('.find');
let idByFind = document.querySelector('.find_by_id');
let addFormDebAccount = document.querySelector('.add_debit_account');
let addDebitCurrency = document.querySelector('.add_debit_currency');
let addDebitBalance = document.querySelector('.add_debit_balance');
let addFormCreditAccount = document.querySelector('.add_credit_account');
let addCreditCurrency = document.querySelector('.add_credit_currency');
let addCreditBalance = document.querySelector('.add_credit_balance');
let addCreditLimit = document.querySelector('.add_credit_limit');
let resultAdding = document.querySelector('.res_adding');
let resultDebAccount = document.querySelector('.res_deb_account');
let resultCreditAccount = document.querySelector('.res_credit_account');
let resultFinding = document.querySelector('.res_finding');
let resultFindingDebAccount = document.querySelector('.res_finding_deb_account');
let resultFindingCreditAccount = document.querySelector('.res_finding_cred_account');
let buttonSumBankMoney = document.querySelector('#sum');
let buttonSumDebitBank = document.querySelector('#deb_sum');
let buttonNumbersDebitors = document.querySelector('#num_deb');
let buttonSumDebitIsactiveClients = document.querySelector('#sum_deb_act_clients');
let totalResult = document.querySelector('.total_result');

class BankClient {
    constructor(id, name, isActive) {
        this.id = id;
        this.name = name;
        this.isActive = isActive;
        this.dataRegistrClient = new Date();
        this.debitAccounts = [];
        this.creditAccounts = [];
    }
}

class Account {
    constructor(currency, balance, creditLimit = null) {
        this.currency = currency;
        this.balance = balance;
        this.creditLimit = creditLimit;
    }
}

let bank = [];

function addClient(id, name, isActive) {
    bank.push(new BankClient(id, name, isActive));
}

addForm.addEventListener('submit', (event) => {
    event.preventDefault();
    let newClient = true;
    bank.forEach(client => {
        if (client.id === addId.value) {
            newClient = false;
        }
    });
    if (newClient) {
        if (/^[0-9]+$/.test(addId.value) && /^[a-z\s]+$/i.test(addName.value)) {
            addClient(addId.value, addName.value, addIsActive.checked);
            resultAdding.innerHTML = `ID - ${addId.value} , Name - ${addName.value} , isActive - ${addIsActive.checked}`;
            clearAddForm();
        } else {
            resultAdding.innerHTML = 'Данные для ввода не корректны';
            clearAddForm();
        }
    } else {
        resultAdding.innerHTML = 'Этот клиент уже внесен!';
        clearAddForm();
    }
    event.target.reset();
});

function clearAddForm() {
    resultDebAccount.innerHTML = '';
    resultCreditAccount.innerHTML = '';
}

addFormDebAccount.addEventListener('submit', (event) => {
    event.preventDefault();
    let debitBalance = +addDebitBalance.value;

    if (/[\d]+/.test(debitBalance) && bank.length > 0) {
        bank[bank.length - 1].debitAccounts.push(new Account(addDebitCurrency.value, debitBalance));
        resultDebAccount.innerHTML = `Дебетовый счет в ${addDebitCurrency.value} на сумму ${debitBalance}`;
    } else {
        resultDebAccount.innerHTML = 'Данные для ввода не корректны';
    }
    event.target.reset();
});

addFormCreditAccount.addEventListener('submit', (event) => {
    event.preventDefault();
    let creditBalance = +addCreditBalance.value;
    let creditLimit = +addCreditLimit.value;
    if (/[\d]+/.test(creditBalance) && /[\d]+/.test(creditLimit) && bank.length > 0) {
        bank[bank.length - 1].creditAccounts.push(new Account(addCreditCurrency.value, creditBalance, creditLimit));
        resultCreditAccount.innerHTML = ` Кредитовый счет в ${addCreditCurrency.value} на сумму ${creditBalance} с лимитом ${creditLimit}`;
    } else {
        resultCreditAccount.innerHTML = 'Данные для ввода не корректны';
    }
    event.target.reset();
});

findForm.addEventListener('submit', (event) => {
    event.preventDefault();
    resultFinding.innerHTML = 'Не является клиентом банка';
    clearFindingForm();
    for (let i = 0; i < bank.length; i++) {
        if (bank[i].id === idByFind.value) {
            resultFinding.innerHTML = `ID - ${bank[i].id} , Name - ${bank[i].name} , isActive - ${bank[i].isActive}`;
            for (let j = 0; j < bank[i].debitAccounts.length; j++) {
                resultFindingDebAccount.innerHTML +=
                    `Дебетовый счет в ${bank[i].debitAccounts[j].currency} на сумму ${bank[i].debitAccounts[j].balance} <br>`;
            }
            for (let j = 0; j < bank[i].creditAccounts.length; j++) {
                resultFindingCreditAccount.innerHTML +=
                    `Кредитовый счет в ${bank[i].creditAccounts[j].currency} на сумму ${bank[i].creditAccounts[j].balance} с лимитом ${bank[i].creditAccounts[j].creditLimit}<br>`;
            }
            document.querySelector('#del').addEventListener('click', () => {
                resultFinding.innerHTML = '';
                clearFindingForm();
                bank.splice(i, 1);
            });
        }
    }
    event.target.reset();
});

function clearFindingForm() {
    resultFindingDebAccount.innerHTML = '';
    resultFindingCreditAccount.innerHTML = '';
}

async function bankMoney(arrayBankCustomers) {
    let sum = 0;
    await requestExchangeRate().then(exchangeRates => {
        arrayBankCustomers.forEach(client => {
            [...client.creditAccounts, ...client.debitAccounts].forEach(account => sum += currencyConversion(account, account.balance, exchangeRates));
        });
    });
    totalResult.innerHTML = sum.toFixed(2);
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
    totalResult.innerHTML = sum.toFixed(2);
}

function numbersDebtors(arrayBankCustomers, activityType) {
    let count = 0;
    arrayBankCustomers.forEach(client => {
        if (client.isActive === activityType) {
            client.creditAccounts.forEach(account => {
                if ((account.balance - account.creditLimit) < 0) {
                    count++;
                }
            });
        }
    });
    totalResult.innerHTML = count;
}

async function sumDebitInactiveClients(arrayBankCustomers, activityType) {
    let sum = 0;
    let debtBalance = 0;
    await requestExchangeRate().then(exchangeRates => {
        arrayBankCustomers.forEach(client => {
            if (client.isActive === activityType) {
                client.creditAccounts.forEach(account => {
                    if ((account.balance - account.creditLimit) < 0) {
                        debtBalance = account.creditLimit - account.balance;
                        sum += currencyConversion(account, debtBalance, exchangeRates);
                    }
                });
            }
        });
    });
    totalResult.innerHTML = sum.toFixed(2);
}

async function requestExchangeRate() {
    let promise = await fetch('https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5');
    return await promise.json();
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

buttonSumBankMoney.addEventListener('click', function () {
    bankMoney(bank);
});

buttonSumDebitBank.addEventListener('click', function () {
    bankDebit(bank);
});

buttonNumbersDebitors.addEventListener('click', function () {
    numbersDebtors(bank, false);
});

buttonSumDebitIsactiveClients.addEventListener('click', function () {
    sumDebitInactiveClients(bank, false);
});

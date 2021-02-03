const Validator = require('validatorjs')

const rules = {
    symbol: 'required',
    amount: 'required|integer|min:1',
    user: 'required'
}

module.exports = (transaction) => {
    return new Validator(transaction, rules)
}
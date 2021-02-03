const Validator = require('validatorjs')

const rules = {
    login: 'required|alpha_dash|min:6',
    password: 'required|alpha_dash|min:6|confirmed',
    password_confirmation: 'required'
}

module.exports = (user) => {
    return new Validator(user, rules)
}
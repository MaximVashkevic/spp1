const { Sequelize, Transaction } = require('sequelize')
const SymbolModel = require('./models/Symbol')
const UserModel = require('./models/User')
const TransactionModel = require('./models/Transaction');
const EventEmitter = require('events')
const bcrypt = require('bcryptjs');
const LoginValidator = require('./validators/loginValidator')
const RegisterValidator = require('./validators/registerValidator')
const BuyValidator = require('./validators/buyValidator')
const { IEXCloudClient } = require('node-iex-cloud')
const fetch = require('node-fetch')
const ValidationError = require('./validationError')

class App extends EventEmitter {
    db = null
    iex = null
    config = null

    constructor(connection, iexClient, config) {
        super()
        this.db = connection
        this.iex = iexClient
        this.config = config
    }

    static async start(config) {
        return (async () => {
            const sequelize = new Sequelize(config.connectionString);
            try {
                await sequelize.authenticate()
                UserModel.define(sequelize)
                SymbolModel.define(sequelize)
                TransactionModel.define(sequelize)
                await sequelize.sync()
            } catch (error) {
                return this.emit('error', error);
            }

            const iex = new IEXCloudClient(fetch, {
                sandbox: true,
                publishable: config.iexPublicKey,
                version: 'stable'
            })

            const app = new App(sequelize, iex, config)

            return app
        })()
    }

    async register(userParams, callback) {
        const User = this.db.models.User
        const registerValidator = RegisterValidator(userParams)
        if (!registerValidator.passes()) {
            let errorStr = [];
            const errors = registerValidator.errors.all()
            for (const errorField of Object.values(errors)) {
                for (const error of errorField) {
                    errorStr.push(error);
                }
            }

            return callback(new ValidationError(errorStr))
        }

        const existingUser = await User.findOne({ where: { login: userParams.login } })
        if (existingUser) {
            return callback(new Error('User already exists'))
        }

        const passwordHash = await bcrypt.hash(userParams.password, this.config.saltLength)
        const user = User.create({ login: userParams.login, password: passwordHash, amount: this.config.initialAmount })
        callback(null, user)
    }

    async logIn(userParams, callback) {
        const User = this.db.models.User
        const loginValidator = LoginValidator(userParams)
        if (!loginValidator.passes()) {
            return callback(new Error('Invalid login or password'))
        }

        const user = await User.findOne({ where: { login: userParams.login } })
        if (user) {
            const passwordMathces = await bcrypt.compare(userParams.password, user.password)
            if (passwordMathces) {
                callback(null, user)
                return
            }
        }
        callback(new Error('Invalid login or password'))
    }

    async lookup(symbol) {
        try {
            return await this.iex
                .symbol(symbol)
                .price()
        }
        catch {
            throw new Error('Invalid symbol')
        }
    }

    async buy(shareParams, callback) {
        const db = this.db
        const TransactionModel = db.models.Transaction
        const SymbolModel = db.models.Symbol
        const buyValidator = BuyValidator(shareParams)
        if (!buyValidator.passes()) {
            return callback(new Error('Invalid symbol or amount of shares'))
        }

        let symbolPrice
        try {
            symbolPrice = await this.lookup(shareParams.symbol)
        }
        catch (err) {
            return callback(err)
        }

        let total = symbolPrice * shareParams.amount

        if (shareParams.user.amount - total < 0) {
            return callback(new Error('Not enough money'))
        }

        try {
            const result = await db.transaction(async (t) => {
                const [symbol, _] = await SymbolModel.findOrCreate({
                    where: { symbol: shareParams.symbol },
                    defaults: { symbol: shareParams.symbol },
                    transaction: t
                })

                await TransactionModel.create({
                    userId: shareParams.user.id,
                    symbolId: symbol.id,
                    shares: shareParams.amount,
                    price: symbolPrice
                }, { transaction: t })

                shareParams.user.amount -= total
                try {
                    await shareParams.user.save({ transaction: t })
                }
                catch (err) {
                    return callback(new Error('Server error'))
                }
            })
            callback(null, result)
        }
        catch (err) {
            callback(new Error('Server error'))
        }
    }

    async history(params, callback) {
        if (typeof (params?.user) === 'undefined') {
            return callback(new Error('Invalid params'))
        }

        const Transaction = this.db.models.Transaction
        const Symbol = this.db.models.Symbol
        try {
            const res = await Transaction.findAll({ where: { userId: params.user.id }, include: [Symbol] })
            callback(null, res)
        }
        catch (err) {
            callback(err)
        }
    }
}

module.exports = App
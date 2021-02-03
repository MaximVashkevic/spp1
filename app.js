const { Sequelize } = require('sequelize')
const SymbolModel = require('./models/Symbol')
const UserModel = require('./models/User')
const TransactionModel = require('./models/Transaction');
const EventEmitter = require('events')
const bcrypt = require('bcryptjs');
const config = require('./config');
const LoginValidator = require('./validators/loginValidator')
const RegisterValidator = require('./validators/registerValidator')
class App extends EventEmitter {
    db = null

    constructor(connection) {
        super()
        this.db = connection;
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
            let app = new App(sequelize)
            return app
        })()
    }

    async register(userParams, callback) {
        const User = this.db.models.User
        const registerValidator = RegisterValidator(userParams)
        if (!registerValidator.passes()) {
            const errors = registerValidator.errors.all()
            return callback(Error('Invalid data'))
        }

        const existingUser = await User.findOne({ where: { login: userParams.login } })
        if (existingUser) {
            return callback(Error('User already exists'))
        }

        const passwordHash = await bcrypt.hash(userParams.password, config.saltLength)
        const user = User.create({ login: userParams.login, password: passwordHash, amount: config.initialAmount })
        callback(null, user)
    }

    async logIn(userParams, callback) {
        const User = this.db.models.User
        const loginValidator = LoginValidator(userParams)
        if (!loginValidator.passes()) {
            return callback(Error('Invalid login or password'))
        }

        bcrypt.hash()
        const user = await User.findOne({ where: { login: userParams.login } })
        if (user) {
            const passwordMathces = await bcrypt.compare(userParams.password, user.password)
            if (passwordMathces) {
                callback(null, user)
                return
            }
        }
        callback(Error('Invalid login or password'))
    }
}

(async () => {

    const emitter = await App.start(config)

    const login = '123456'
    const pwd = '654321'

    // await emitter.register({ login: login, password: pwd, password_confirmation: pwd },
    //     (err, res) => { if (!err) { console.log(res) } else { console.error(err); } })
    await emitter.logIn({ login: login, password: pwd },
        (err, res) => { if (!err) { console.log('logged ' + res) } else { console.error(err); } })
})()

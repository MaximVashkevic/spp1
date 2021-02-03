const { Sequelize, Transaction } = require('sequelize')
const SymbolModel = require('./models/Symbol')
const UserModel = require('./models/User')
const TransactionModel = require('./models/Transaction')

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'database.sqlite'
});

(async () => {
    try {
        await sequelize.authenticate()
        UserModel.define(sequelize)
        SymbolModel.define(sequelize)
        TransactionModel.define(sequelize)
        await sequelize.sync()
    } catch (error) {
        console.error('Can\'t connect: ', error);
    }
})()
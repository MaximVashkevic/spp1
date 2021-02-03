const { DataTypes, Model } = require('sequelize')
const User = require('./User')
const Symbol = require('./Symbol')

class Transaction extends Model {
    static define(connection) {
        Transaction.init({
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: User,
                    key: 'id'
                }
            },
            symbolId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: Symbol,
                    key: 'id'
                }
            },
            shares: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            price: {
                type: DataTypes.DECIMAL(65, 2),
                allowNull: false,
            }
        }, {
            sequelize: connection,
            modelName: 'Transaction',
            timestamps: true,
            createdAt: 'time',
            updatedAt: false
        })

        Transaction.belongsTo(User, {foreignKey: 'userId'})
        Transaction.belongsTo(Symbol, {foreignKey: 'symbolId'})
    }
}

module.exports = Transaction
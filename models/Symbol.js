const { DataTypes, Model } = require('sequelize')

class Symbol extends Model {
    static define(connection) {
        Symbol.init({
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },
            symbol: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            companyName: {
                type: DataTypes.STRING,
                allowNull: false
            }
        }, {
            sequelize: connection,
            modelName: 'Symbol',
            timestamps: false,
        })
    }
}

module.exports = Symbol
const { DataTypes, Model } = require('sequelize')

class User extends Model {
    static define(connection) {
        User.init({
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },
            login: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            amount: {
                type: DataTypes.DECIMAL(65, 2),
                allowNull: false,
            }
        }, {
            sequelize: connection,
            modelName: 'User',
            timestamps: false,
        })
    }
}

module.exports = User
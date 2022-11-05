const sequelize = require('../db')
const { DataTypes } = require('sequelize')

module.exports = sequelize.define('role', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    role: {type: DataTypes.STRING}
})
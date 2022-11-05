const sequelize = require('../db')
const { DataTypes } = require('sequelize')

module.exports = sequelize.define('access', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    date: {type: DataTypes.DATE},
})
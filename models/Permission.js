const sequelize = require('../db')
const { DataTypes } = require('sequelize')

module.exports = sequelize.define('permission', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
})
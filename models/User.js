const sequelize = require('../db')
const { DataTypes } = require('sequelize')

module.exports = sequelize.define('user', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    email: {type: DataTypes.STRING, unique: true},
    password: {type: DataTypes.STRING},
    usedSpace: {type: DataTypes.STRING, defaultValue: 0},
    avatar: {type: DataTypes.STRING},
})
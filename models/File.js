const sequelize = require('../db')
const { DataTypes } = require('sequelize')

module.exports = sequelize.define('file', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    name: {type: DataTypes.STRING, unique: true},
    type: {type: DataTypes.STRING},
    size: {type: DataTypes.FLOAT},
    favorite: {type: DataTypes.BOOLEAN, defaultValue: false},
    access_link: {type: DataTypes.STRING},
    access_type: {type: DataTypes.STRING}
})
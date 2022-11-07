const sequelize = require('../db')
const { DataTypes } = require('sequelize')

module.exports = sequelize.define('file', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    name: {type: DataTypes.STRING, allowNull: false},
    type: {type: DataTypes.STRING, allowNull: false},
    size: {type: DataTypes.FLOAT, defaultValue: 0},
    path: {type: DataTypes.STRING, defaultValue: ''},
    favorite: {type: DataTypes.BOOLEAN, defaultValue: false},
    access_link: {type: DataTypes.STRING},
    access_type: {type: DataTypes.STRING}
})
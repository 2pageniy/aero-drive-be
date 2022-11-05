require('dotenv').config();
const express = require('express');
const sequelize = require('./db');
const models = require('./models/index');
const PORT = process.env.PORT || 5000;


const app = express();

app.use(express.json())

const start = async () => {
    try {
        await sequelize.authenticate()
        await sequelize.sync()
        app.listen(PORT, () => {
            console.log('server start: '+ PORT)
        })
    } catch (e) {
        console.log(e)
    }
}

start()
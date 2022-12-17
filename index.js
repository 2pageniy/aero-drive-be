require('dotenv').config();
require('./models/index');
const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const sequelize = require('./db');
const router = require('./routes/index');
const PORT = process.env.PORT || 5000;


const app = express();

app.use(fileUpload({}));
app.use(express.json());
app.use(express.static('static'));
app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL
}));
app.use('/api', router);

const start = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync();
        app.listen(PORT, () => {
            console.log('server start: '+ PORT)
        });
    } catch (e) {
        console.log(e);
    }
}

start();
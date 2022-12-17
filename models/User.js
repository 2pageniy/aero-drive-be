const sequelize = require('../db')

// module.exports = sequelize.define('user', {
//     id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
//     email: {type: DataTypes.STRING, unique: true},
//     password: {type: DataTypes.STRING},
//     usedSpace: {type: DataTypes.STRING, defaultValue: 0},
//     avatar: {type: DataTypes.STRING},
// })

module.exports = sequelize.query(`
CREATE TABLE IF NOT EXISTS "users"(
    "id"  SERIAL ,
    "name" VARCHAR(255),
    "email" VARCHAR(255) UNIQUE,
    "password" VARCHAR(255),
    "usedSpace" VARCHAR(255) DEFAULT 0,
    "avatar" VARCHAR(255),
    PRIMARY KEY ("id")
);`);

// CREATE TABLE IF NOT EXISTS "users"(
//     "id"  SERIAL ,
//     "email" VARCHAR(255) UNIQUE,
//     "password" VARCHAR(255),
//     "usedSpace" VARCHAR(255) DEFAULT 0,
//     "avatar" VARCHAR(255),
//     "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
//     "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
//     PRIMARY KEY ("id")
// );

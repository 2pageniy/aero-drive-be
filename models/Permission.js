const sequelize = require('../db')

// module.exports = sequelize.define('permission', {
//     id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
// })

module.exports = sequelize.query(`
CREATE TABLE IF NOT EXISTS "permissions" (
    "id"  SERIAL ,
    "userId" INTEGER REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "roleId" INTEGER REFERENCES "roles" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    PRIMARY KEY ("id")
);`)

// CREATE TABLE IF NOT EXISTS "permissions" (
//     "id"  SERIAL ,
//     "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
//     "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
//     "userId" INTEGER REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
//     "roleId" INTEGER REFERENCES "roles" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
//     PRIMARY KEY ("id")
// );
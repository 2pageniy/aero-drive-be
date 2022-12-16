const sequelize = require('../db')


//  sequelize.define('access', {
//     id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
//     date: {type: DataTypes.DATE},
// })

module.exports = sequelize.query(`
CREATE TABLE IF NOT EXISTS "accesses" (                                             
    "id"  SERIAL ,                                                                  
    "date" TIMESTAMP WITH TIME ZONE,                               
    "userId" INTEGER REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE, 
    "fileId" INTEGER REFERENCES "files" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    PRIMARY KEY ("id")                                                              
);`)
// CREATE TABLE IF NOT EXISTS "accesses" (
//     "id"  SERIAL ,
//     "date" TIMESTAMP WITH TIME ZONE,
//     "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
//     "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
//     "userId" INTEGER REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
//     "fileId" INTEGER REFERENCES "files" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
//     PRIMARY KEY ("id")
// );
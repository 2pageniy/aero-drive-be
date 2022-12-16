const sequelize = require('../db')

// module.exports = sequelize.define('file', {
//     id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
//     name: {type: DataTypes.STRING, allowNull: false},
//     type: {type: DataTypes.STRING, allowNull: false},
//     size: {type: DataTypes.FLOAT, defaultValue: 0},
//     path: {type: DataTypes.STRING, defaultValue: ''},
//     favorite: {type: DataTypes.BOOLEAN, defaultValue: false},
//     access_link: {type: DataTypes.STRING},
//     access_type: {type: DataTypes.STRING}
// })

module.exports = sequelize.query(`
CREATE TABLE IF NOT EXISTS "files" (
    "id"  SERIAL ,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(255) NOT NULL,
    "size" FLOAT DEFAULT 0,
    "path" VARCHAR(255) DEFAULT '',
    "favorite" BOOLEAN DEFAULT false,
    "access_link" VARCHAR(255),
    "access_type" VARCHAR(255),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp,
    "userId" INTEGER REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "parentId" INTEGER REFERENCES "files" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    PRIMARY KEY ("id")                                                          
);`);



// CREATE TABLE IF NOT EXISTS "files" (
//     "id"  SERIAL ,
//     "name" VARCHAR(255) NOT NULL,
//     "type" VARCHAR(255) NOT NULL,
//     "size" FLOAT DEFAULT '0',
//     "path" VARCHAR(255) DEFAULT '',
//     "favorite" BOOLEAN DEFAULT false,
//     "access_link" VARCHAR(255),
//     "access_type" VARCHAR(255),
//     "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
//     "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
//     "userId" INTEGER REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
//     "parentId" INTEGER REFERENCES "files" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
//     PRIMARY KEY ("id")
// );
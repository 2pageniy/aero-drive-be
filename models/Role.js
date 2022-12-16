const sequelize = require('../db')

// module.exports = sequelize.define('role', {
//     id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
//     role: {type: DataTypes.STRING}
// })

module.exports = sequelize.query(`
CREATE TABLE IF NOT EXISTS "roles" (
    "id"  SERIAL, 
    "role" VARCHAR(255) UNIQUE,
    PRIMARY KEY ("id")
);
INSERT INTO roles (role) VALUES ('user')
ON CONFLICT (role) DO UPDATE SET role = 'user';

INSERT INTO roles (role) VALUES ('admin')
ON CONFLICT (role) DO UPDATE SET role = 'admin';
`);

// CREATE TABLE IF NOT EXISTS "roles" (
//     "id"  SERIAL , "role" VARCHAR(255),
//     "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
//     "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
//     PRIMARY KEY ("id")
// );

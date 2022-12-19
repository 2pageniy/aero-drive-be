const sequelize = require("../db");

module.exports = sequelize.query(`
CREATE TABLE IF NOT EXISTS "users"(
    "id"  SERIAL,
    "name" VARCHAR(255),
    "email" VARCHAR(255) UNIQUE,
    "password" VARCHAR(255),
    "usedSpace" VARCHAR(255) DEFAULT 0,
    "avatar" VARCHAR(255),
    PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "roles" (
    "id"  SERIAL, 
    "role" VARCHAR(255) UNIQUE,
    PRIMARY KEY ("id")
);
INSERT INTO roles (role) VALUES ('user')
ON CONFLICT (role) DO UPDATE SET role = 'user';

INSERT INTO roles (role) VALUES ('admin')
ON CONFLICT (role) DO UPDATE SET role = 'admin';

CREATE TABLE IF NOT EXISTS "permissions" (
    "id"  SERIAL,
    "userId" INTEGER REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "roleId" INTEGER REFERENCES "roles" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "files" (
    "id"  SERIAL,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(255) NOT NULL,
    "size" FLOAT DEFAULT 0,
    "path" VARCHAR(255) DEFAULT '',
    "favorite" BOOLEAN DEFAULT false,
    "access_link" VARCHAR(255),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp,
    "userId" INTEGER REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "parentId" INTEGER REFERENCES "files" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    PRIMARY KEY ("id")                                                          
);

CREATE TABLE IF NOT EXISTS "accesses" (                                             
    "id"  SERIAL,                                                                  
    "date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp,                         
    "userId" INTEGER REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE, 
    "fileId" INTEGER REFERENCES "files" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    PRIMARY KEY ("id")                                                              
);
`);
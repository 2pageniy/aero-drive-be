const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const ApiError = require("../error/ApiError");
const fileService = require('../services/fileService');
const sequelize = require('../db')
const {QueryTypes} = require("sequelize");
const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require("path");

const generateJwt = (id, email, roles) => {
    return jwt.sign(
        {id, email, roles},
        process.env.SECRET_KEY,
        {expiresIn: '24h'}
    )
}

class UserController {
    async registration(req, res, next) {
        try {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return res.status(400).json({message: 'Incorrect request', errors})
            }

            const {name, email, password} = req.body;
            const candidate = await sequelize.query(`SELECT * FROM users WHERE email = '${email}'`, {type: QueryTypes.SELECT});

            if (candidate.length) {
                return res.status(400).json({message: 'User with such email exists'})
            }

            const hashPassword = await bcrypt.hash(password, 5);
            const [userRole] = await sequelize.query(`SELECT * FROM roles WHERE role = 'user';`, {type: QueryTypes.SELECT});
            await sequelize.query(`INSERT INTO users (name, email, password) VALUES ('${name}', '${email}', '${hashPassword}');`, {type: QueryTypes.INSERT});
            const [user] = await sequelize.query(`SELECT * FROM users WHERE email = '${email}'`, {type: QueryTypes.SELECT});

            await sequelize.query(`INSERT INTO permissions ("userId", "roleId") VALUES ('${user.id}', '${userRole.id}');`, {type: QueryTypes.INSERT});
            const file = {userId: user.id, name: '', type: 'dir', path: ''};
            await fileService.createDir(file)

            const token = generateJwt(user.id, user.email, 'user');

            const userData = {id: user.id, name, email: user.email, roles: ['user']};

            return res.json({token, userData})
        } catch (e) {
            console.log(e)
            next(ApiError.badRequest('Error', e))
        }
    }

    async login(req, res, next) {
        try {
            const {email, password} = req.body;
            const [user] = await sequelize.query(`SELECT * FROM users WHERE email = '${email}'`, {type: QueryTypes.SELECT});

            if (!user) {
                return res.status(404).json({message: 'User not found'});
            }

            const isPassEquals = await bcrypt.compare(password, user.password);

            if (!isPassEquals) {
                return res.status(400).json({message: 'Incorrect password or email'});
            }

            //Search all rolesId and search all roles in array
            let rolesId = await sequelize.query(`SELECT * FROM permissions WHERE "userId" = ${user.id}`, {type: QueryTypes.SELECT});
            rolesId = rolesId.map(roleId => roleId.roleId)
            let roles = await sequelize.query(`SELECT * FROM roles WHERE "id" = ${rolesId}`, {type: QueryTypes.SELECT});
            roles = roles.map(role => role.role)

            const token = generateJwt(user.id, user.email, roles);
            const userData = {
                id: user.id,
                name: user.name,
                email: user.email,
                roles,
                avatar: user.avatar
            };
            return res.json({token, user: userData});
        } catch (e) {
            console.log(e)
            next(ApiError.badRequest('Error', e))
        }
    }

    async check(req, res, next) {
        try {
            const [user] = await sequelize.query(`SELECT * FROM users WHERE id = ${req.user.id}`, {type: QueryTypes.SELECT});
            const roles = req.user.roles;
            const {id, email, name, usedSpace, avatar} = user;
            const token = generateJwt(id, email, roles);
            const dbUser = {
                id,
                email,
                roles,
                name,
                usedSpace,
                avatar,
            }
            return res.json({token, user: dbUser});
        } catch (e) {
            console.log(e);
            next(ApiError.badRequest('Error auth'))
        }

    }

    async updateUser(req, res, next) {
        try {
            const {name, email} = req.body

            await sequelize.query(`UPDATE users SET name = '${name}', email = '${email}' WHERE id = ${req.user.id}`, {type: QueryTypes.UPDATE})
            const [user] = await sequelize.query(`SELECT * FROM users WHERE id = ${req.user.id}`, {type: QueryTypes.SELECT});
            return res.json({user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    usedSpace: user.usedSpace,
                    avatar: user.avatar
                },
                message: 'Update successful'
            })
        } catch (e) {
            console.log(e);
            next(ApiError.badRequest('Error Update'))
        }
    }

    async changePassword(req, res, next) {
        try {
            const {password, newPassword} = req.body
            const [user] = await sequelize.query(`SELECT * FROM users WHERE id = ${req.user.id}`, {type: QueryTypes.SELECT});
            const isPassEquals = await bcrypt.compare(password, user.password);

            if (!isPassEquals) {
                return res.status(400).json({message: 'Incorrect password'});
            }
            const hashPassword = await bcrypt.hash(newPassword, 5);
            await sequelize.query(`UPDATE users SET password = '${hashPassword}' WHERE id = ${req.user.id}`, {type: QueryTypes.UPDATE})
            return res.json({message: 'Password update'})
        } catch (e) {
            console.log(e);
            next(ApiError.badRequest('Error Update'))
        }
    }

    async deleteUser(req, res, next) {
        try {
            const id = req.query.id
            const pathUser = path.join(__dirname, '..', 'files', `${id}`)

            await sequelize.query(`DELETE FROM users WHERE id = ${id}`);
            await sequelize.query(`DELETE FROM files WHERE "userId" = ${id}`);
            await sequelize.query(`DELETE FROM permissions WHERE "userId" = ${id}`);
            await sequelize.query(`DELETE FROM accesses WHERE "userId" = ${id}`);

            await fsPromises.rm(pathUser, {recursive: true, force: true});

            return res.json({message: 'Delete user successful'})
        } catch (e) {
            console.log(e);
            next(ApiError.badRequest('Error delete user'))
        }
    }
}

module.exports = new UserController();
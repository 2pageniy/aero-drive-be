const User = require('../models/User');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const ApiError = require("../error/ApiError");

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

            const {email, password} = req.body;
            const candidate = await User.findOne({where: {email}});

            if (candidate) {
                res.status(400).json({message: 'User with such email exists'})
            }

            const hashPassword = await bcrypt.hash(password, 5);
            const userRole = await Role.findOne({where: {role: 'user'}});
            const user = await User.create({email, password: hashPassword});
            await Permission.create({userId: user.id, roleId: userRole.id});

            const token = generateJwt(user.id, user.email, userRole.role);

            return res.json({token})
        } catch (e) {
            next(ApiError.badRequest('Error', e))
        }
    }

    async login(req, res, next) {
        try {
            const {email, password} = req.body;

            const user = await User.findOne({where: {email}});

            if (!user) {
                return res.status(404).json({message: 'User not found'});
            }

            const isPassEquals = await bcrypt.compare(password, user.password);

            if (!isPassEquals) {
                return res.status(400).json({message: 'Incorrect password or email'});
            }

            //Search all rolesId and search all roles in array
            let rolesId = await Permission.findAll({where: {userId: user.id}});
            rolesId = rolesId.map(roleId => roleId.roleId)
            let roles = await Role.findAll({where: {id: rolesId}});
            roles = roles.map(role => role.role)

            const token = generateJwt(user.id, user.email, roles);
            const userData = {id: user.id, email: user.email, roles};
            return res.json({token, user: userData});
        } catch (e) {
            next(ApiError.badRequest('Error', e))
        }
    }

    async check(req, res, next) {
        const user = req.user;
        const {id, email, roles} = user;
        const token = generateJwt(id, email, roles)
        return res.json({token, user})
    }
}

module.exports = new UserController();
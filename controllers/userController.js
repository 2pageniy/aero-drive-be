const User = require('../models/User');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const generateJwt = (id, email, role) => {
    return jwt.sign(
        {id, email, role},
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
            console.log(e)
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
            const {role} = await Permission.findOne({where: {userId: user.id}});
            const token = generateJwt(user.id, user.email, role)
            return res.json({token})
        } catch (e) {
            console.log(e)
        }
    }

    async check() {

    }
}

module.exports = new UserController();
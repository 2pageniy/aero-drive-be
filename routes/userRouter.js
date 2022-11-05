const Router = require('express');
const router = new Router();
const { body } = require('express-validator');
const userController = require('../controllers/userController');

router.post('/registration',
    body('email').isEmail(),
    body('password').isLength({min:3}),
    userController.registration);
router.post('/login', userController.login);
router.post('/auth', userController.check);

module.exports = router;
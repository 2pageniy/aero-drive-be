const Router = require('express');
const router = new Router();
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware')

router.post('/registration',
    body('email').isEmail(),
    body('password').isLength({min:3}),
    userController.registration);
router.post('/login', userController.login);
router.get('/auth', authMiddleware, userController.check);
router.delete('/delete', authMiddleware, userController.deleteUser);
router.patch('/update', authMiddleware, userController.updateUser);
router.patch('/update/password', authMiddleware, userController.changePassword);

module.exports = router;
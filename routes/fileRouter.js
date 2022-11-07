const Router = require('express');
const router = new Router();
const authMiddleware = require('../middleware/authMiddleware');
const fileController = require('../controllers/fileController');

router.post('', authMiddleware, fileController.createDir);

module.exports = router;
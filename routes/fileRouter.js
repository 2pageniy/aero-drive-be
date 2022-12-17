const Router = require('express');
const router = new Router();
const authMiddleware = require('../middleware/authMiddleware');
const fileController = require('../controllers/fileController');

router.post('', authMiddleware, fileController.createDir);
router.post('/upload', authMiddleware, fileController.uploadFile);
router.post('/avatar', authMiddleware, fileController.uploadAvatar);
router.post('/copy', authMiddleware, fileController.createCopyFile);
router.post('/read', authMiddleware, fileController.readFile);
router.get('', authMiddleware, fileController.getFiles);
router.get('/download', authMiddleware, fileController.downloadFile);
router.get('/search', authMiddleware, fileController.searchFile);
router.delete('/delete', authMiddleware, fileController.deleteFile);
router.delete('/avatar', authMiddleware, fileController.deleteAvatar);
router.patch('/favorite', authMiddleware, fileController.addFavorite);

module.exports = router;
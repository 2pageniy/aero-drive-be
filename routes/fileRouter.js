const Router = require('express');
const router = new Router();
const authMiddleware = require('../middleware/authMiddleware');
const fileController = require('../controllers/fileController');

router.post('', authMiddleware, fileController.createDir);
router.post('/upload', authMiddleware, fileController.uploadFile);
router.post('/avatar', authMiddleware, fileController.uploadAvatar);
router.post('/copy', authMiddleware, fileController.createCopyFile);
router.post('/read', fileController.readFile);
router.get('', authMiddleware, fileController.getFiles);
router.get('/download', fileController.downloadFile);
router.get('/search', authMiddleware, fileController.searchFile);
router.get('/link', fileController.getFilesOnLink);
router.delete('/delete', authMiddleware, fileController.deleteFile);
router.delete('/avatar', authMiddleware, fileController.deleteAvatar);
router.patch('/favorite', authMiddleware, fileController.addFavorite);
router.patch('/link', authMiddleware, fileController.createAccessLink);

module.exports = router;
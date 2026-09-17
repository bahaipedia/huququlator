const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadController = require('../controllers/uploadController');
const { verifyToken } = require('../middlewares/auth');

// Configure multer
const upload = multer({ 
    dest: 'uploads/',
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB limit
});

router.get('/data', verifyToken, uploadController.getUploadPageData);
router.post('/', verifyToken, upload.single('csvFile'), uploadController.uploadTransactions);
router.delete('/:uploadId', verifyToken, uploadController.deleteUpload);

module.exports = router;

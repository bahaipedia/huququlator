const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middlewares/auth');

// Note: Both verifyToken AND isAdmin are applied here
router.get('/stats', verifyToken, isAdmin, adminController.getDashboardStats);
router.delete('/user/:id', verifyToken, isAdmin, adminController.deleteUser);

module.exports = router;

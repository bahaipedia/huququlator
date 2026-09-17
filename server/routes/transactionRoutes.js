const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { verifyToken } = require('../middlewares/auth');

router.get('/', verifyToken, transactionController.getTransactions);
router.put('/categorize', verifyToken, transactionController.categorizeTransaction);
router.post('/filter', verifyToken, transactionController.handleFilter);

module.exports = router;

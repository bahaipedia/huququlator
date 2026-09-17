const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken } = require('../middlewares/auth');

router.get('/', verifyToken, dashboardController.getDashboardData);
router.put('/entry/:labelId', verifyToken, dashboardController.updateEntry);
router.post('/label', verifyToken, dashboardController.addLabel);
router.delete('/label/:labelId', verifyToken, dashboardController.deleteLabel);
router.post('/year', verifyToken, dashboardController.addYear);
router.delete('/year/:date', verifyToken, dashboardController.deleteYear);
router.put('/summary/:date', verifyToken, dashboardController.updateSummaryField);

module.exports = router;

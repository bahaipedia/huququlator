const express = require('express');
const router = express.Router();
const ruleController = require('../controllers/ruleController');
const { verifyToken } = require('../middlewares/auth');

router.get('/', verifyToken, ruleController.getRules);
router.post('/', verifyToken, ruleController.createRule);
router.delete('/:ruleId', verifyToken, ruleController.deleteRule);

module.exports = router;

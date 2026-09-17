const express = require('express');
const router = express.Router();
const goldService = require('../services/goldService');

// GET /api/gold-price?date=YYYYMMDD
router.get('/gold-price', async (req, res) => {
    try {
        const { date } = req.query;
        const price = await goldService.getGoldPrice(date);
        
        if (price) {
            res.status(200).json({ value: price });
        } else {
            res.status(500).json({ value: null, error: 'Gold price unavailable' });
        }
    } catch (error) {
        console.error('Error fetching gold price:', error);
        res.status(500).json({ value: null, error: 'Server Error' });
    }
});

module.exports = router;

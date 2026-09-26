const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// @route   GET /api/stats
// @desc    Get dashboard statistics
// @access  Private (Admin)
router.get('/', authMiddleware, roleMiddleware('Admin'), async (req, res) => {
    try {
        const [deptResult, docResult, patResult] = await Promise.all([
            executeQuery('SELECT COUNT(*) AS count FROM DEPARTMENT'),
            executeQuery('SELECT COUNT(*) AS count FROM DOCTOR'),
            executeQuery('SELECT COUNT(*) AS count FROM PATIENT'),
        ]);

        res.json({
            departments: deptResult.rows[0]?.COUNT || 0,
            doctors: docResult.rows[0]?.COUNT || 0,
            patients: patResult.rows[0]?.COUNT || 0,
        });
    } catch (err) {
        console.error('Error fetching admin stats:', err.message);
        res.status(500).json({ message: 'Server error retrieving system stats' });
    }
});

module.exports = router;

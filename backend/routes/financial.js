const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const financialController = require('../controllers/financialController');

router.use(authMiddleware);

// @route   GET /api/financial/summary
// @desc    Get total earnings for admin and overall doctors
router.get('/summary', financialController.getFinancialSummary);

// @route   GET /api/financial/ledger
// @desc    Get all financial ledger transactions
router.get('/ledger', financialController.getLedger);

// @route   GET /api/financial/audit-logs
// @desc    Get system audit log records
router.get('/audit-logs', financialController.getAuditLogs);

module.exports = router;

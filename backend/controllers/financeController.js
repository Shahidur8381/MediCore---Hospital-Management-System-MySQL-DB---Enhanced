const { executeQuery } = require('../config/db');

// @route   GET /api/finance/doctor-stats
// @desc    Get earnings and withdrawal stats for the logged-in doctor
// @access  Private (Doctor)
exports.getDoctorStats = async (req, res) => {
    try {
        const doctorId = req.user.doctorId;
        
        const result = await executeQuery(
            `SELECT 
                IFNULL(SUM(CASE WHEN is_cleared = 'N' THEN doctor_amount ELSE 0 END), 0) as available,
                IFNULL(SUM(CASE WHEN is_cleared = 'P' THEN doctor_amount ELSE 0 END), 0) as pending,
                IFNULL(SUM(CASE WHEN is_cleared = 'Y' THEN doctor_amount ELSE 0 END), 0) as cleared,
                IFNULL(SUM(doctor_amount), 0) as total_earned
             FROM FINANCIAL_LEDGER
             WHERE doctor_id = ?`,
            [doctorId]
        );

        const stats = result.rows[0] || {};
        res.json({
            available: parseFloat(stats.AVAILABLE || 0),
            pending: parseFloat(stats.PENDING || 0),
            cleared: parseFloat(stats.CLEARED || 0),
            total: parseFloat(stats.TOTAL_EARNED || 0)
        });
    } catch (err) {
        console.error('Error fetching doctor stats:', err.message);
        res.status(500).json({ message: 'Server error retrieving doctor stats' });
    }
};

// @route   POST /api/finance/withdraw
// @desc    Request withdrawal for all available earnings
// @access  Private (Doctor)
exports.requestWithdrawal = async (req, res) => {
    try {
        const doctorId = req.user.doctorId;
        
        // Check if there are any available funds
        const result = await executeQuery(
            `SELECT IFNULL(SUM(doctor_amount), 0) as available FROM FINANCIAL_LEDGER WHERE doctor_id = ? AND is_cleared = 'N'`,
            [doctorId]
        );

        const available = parseFloat(result.rows[0]?.AVAILABLE || 0);

        if (available <= 0) {
            return res.status(400).json({ message: 'No available funds to withdraw' });
        }

        // Update all 'N' records to 'P' (Pending)
        await executeQuery(
            `UPDATE FINANCIAL_LEDGER SET is_cleared = 'P' WHERE doctor_id = ? AND is_cleared = 'N'`,
            [doctorId]
        );

        res.json({ message: 'Withdrawal requested successfully', amountRequested: available });
    } catch (err) {
        console.error('Error requesting withdrawal:', err.message);
        res.status(500).json({ message: 'Server error requesting withdrawal' });
    }
};

// @route   GET /api/finance/admin-stats
// @desc    Get high-level hospital revenue stats
// @access  Private (Admin)
exports.getAdminStats = async (req, res) => {
    try {
        const result = await executeQuery(
            `SELECT 
                IFNULL(SUM(total_amount), 0) as total_revenue,
                IFNULL(SUM(admin_amount), 0) as hospital_earned,
                IFNULL(SUM(CASE WHEN is_cleared = 'P' THEN doctor_amount ELSE 0 END), 0) as payment_to_clear
             FROM FINANCIAL_LEDGER`
        );

        const stats = result.rows[0] || {};
        res.json({
            totalRevenue: parseFloat(stats.TOTAL_REVENUE || 0),
            hospitalEarned: parseFloat(stats.HOSPITAL_EARNED || 0),
            paymentToClear: parseFloat(stats.PAYMENT_TO_CLEAR || 0)
        });
    } catch (err) {
        console.error('Error fetching admin stats:', err.message);
        res.status(500).json({ message: 'Server error retrieving admin stats' });
    }
};

// @route   GET /api/finance/pending-withdrawals
// @desc    Get a list of doctors with pending withdrawals
// @access  Private (Admin)
exports.getPendingWithdrawals = async (req, res) => {
    try {
        const result = await executeQuery(
            `SELECT 
                f.doctor_id,
                d.name as doctor_name,
                SUM(f.doctor_amount) as pending_amount,
                MIN(f.transaction_date) as oldest_transaction
             FROM FINANCIAL_LEDGER f
             JOIN DOCTOR d ON f.doctor_id = d.doctor_id
             WHERE f.is_cleared = 'P'
             GROUP BY f.doctor_id, d.name`
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching pending withdrawals:', err.message);
        res.status(500).json({ message: 'Server error retrieving pending withdrawals' });
    }
};

// @route   POST /api/finance/clear-withdrawal/:doctorId
// @desc    Clear pending withdrawal for a doctor
// @access  Private (Admin)
exports.clearWithdrawal = async (req, res) => {
    try {
        const doctorId = req.params.doctorId;
        
        const result = await executeQuery(
            `UPDATE FINANCIAL_LEDGER SET is_cleared = 'Y' WHERE doctor_id = ? AND is_cleared = 'P'`,
            [parseInt(doctorId, 10)]
        );

        if (result.rowsAffected === 0) {
            return res.status(400).json({ message: 'No pending withdrawal found for this doctor' });
        }

        res.json({ message: 'Payment cleared successfully' });
    } catch (err) {
        console.error('Error clearing withdrawal:', err.message);
        res.status(500).json({ message: 'Server error clearing payment' });
    }
};

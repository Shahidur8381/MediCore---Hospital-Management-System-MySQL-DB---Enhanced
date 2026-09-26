const { executeQuery } = require('../config/db');

// @route   GET /api/financial/summary
// @desc    Get total earnings for admin and overall doctors
// @access  Private (Admin only)
exports.getFinancialSummary = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied: Admin role required' });
        }

        const summaryQuery = `
            SELECT 
                IFNULL(SUM(admin_amount), 0) as total_admin_earnings,
                IFNULL(SUM(doctor_amount), 0) as total_doctor_earnings,
                IFNULL(SUM(total_amount), 0) as total_revenue
            FROM FINANCIAL_LEDGER
        `;

        const result = await executeQuery(summaryQuery);
        res.json(result.rows[0] || { TOTAL_ADMIN_EARNINGS: 0, TOTAL_DOCTOR_EARNINGS: 0, TOTAL_REVENUE: 0 });
    } catch (err) {
        console.error('Error fetching financial summary:', err.message);
        res.status(500).json({ message: 'Server error retrieving financial summary' });
    }
};

// @route   GET /api/financial/ledger
// @desc    Get all financial ledger transactions
// @access  Private (Admin only)
exports.getLedger = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied: Admin role required' });
        }

        const query = `
            SELECT 
                f.ledger_id,
                f.transaction_type,
                f.reference_id,
                f.total_amount,
                f.doctor_amount,
                f.admin_amount,
                f.is_cleared,
                f.transaction_date,
                p.name as patient_name,
                d.name as doctor_name
            FROM FINANCIAL_LEDGER f
            LEFT JOIN PATIENT p ON f.patient_id = p.patient_id
            LEFT JOIN DOCTOR d ON f.doctor_id = d.doctor_id
            ORDER BY f.transaction_date DESC
        `;

        const result = await executeQuery(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching ledger:', err.message);
        res.status(500).json({ message: 'Server error retrieving ledger' });
    }
};

// @route   GET /api/financial/audit-logs
// @desc    Get system audit log records (financial & clinical transactions)
// @access  Private (Admin only)
exports.getAuditLogs = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied: Admin role required' });
        }

        const query = `
            SELECT 
                f.ledger_id as id,
                f.transaction_date as timestamp,
                COALESCE(p.name, 'System') as user_name,
                'Patient' as role,
                CONCAT('Payment for ', f.transaction_type) as action,
                CONCAT(f.transaction_type, ' #', f.reference_id) as entity,
                CASE 
                    WHEN f.is_cleared = 'Y' THEN 'Cleared'
                    WHEN f.is_cleared = 'P' THEN 'Pending Clearance'
                    ELSE 'Recorded'
                END as status,
                f.total_amount as amount,
                d.name as doctor_name
            FROM FINANCIAL_LEDGER f
            LEFT JOIN PATIENT p ON f.patient_id = p.patient_id
            LEFT JOIN DOCTOR d ON f.doctor_id = d.doctor_id
            ORDER BY f.transaction_date DESC
            LIMIT 100
        `;

        const result = await executeQuery(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching audit logs:', err.message);
        res.status(500).json({ message: 'Server error retrieving audit logs' });
    }
};

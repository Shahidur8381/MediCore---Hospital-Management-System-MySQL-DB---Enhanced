const { executeQuery, getConnection } = require('../config/db');

// @route   GET /api/lab/tests
// @desc    Get all available lab tests
// @access  Private
exports.getAvailableTests = async (req, res) => {
    try {
        const result = await executeQuery(`SELECT * FROM LAB_TEST WHERE status = 'Available' ORDER BY test_name`);
        res.json(result.rows);
    } catch (err) {
        console.error('Error getting lab tests:', err.message);
        res.status(500).json({ message: 'Server error retrieving lab tests' });
    }
};

// @route   GET /api/lab/records
// @desc    Get lab test records filtered by role
// @access  Private
exports.getLabRecords = async (req, res) => {
    try {
        let query = `
            SELECT r.*, t.test_name, t.test_fee, d.name as doctor_name, p.name as patient_name
            FROM LAB_TEST_RECORD r
            JOIN LAB_TEST t ON r.test_id = t.test_id
            JOIN DOCTOR d ON r.doctor_id = d.doctor_id
            JOIN PATIENT p ON r.patient_id = p.patient_id
        `;
        let params = [];
        let whereClauses = [];

        if (req.user.role === 'Patient') {
            whereClauses.push('r.patient_id = ?');
            params.push(req.user.patientId);
        } else if (req.user.role === 'Doctor') {
            whereClauses.push('r.doctor_id = ?');
            params.push(req.user.doctorId);
        } else if (req.user.role === 'Lab') {
            // Lab sees all records that have been paid for
            whereClauses.push("r.payment_status = 'Paid'");
        }

        if (whereClauses.length > 0) {
            query += ' WHERE ' + whereClauses.join(' AND ');
        }

        query += ' ORDER BY r.order_date DESC';

        const result = await executeQuery(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error getting lab records:', err.message);
        res.status(500).json({ message: 'Server error retrieving lab records' });
    }
};

// @route   POST /api/lab/records
// @desc    Order a new lab test
// @access  Private (Doctor only)
exports.orderLabTest = async (req, res) => {
    try {
        if (req.user.role !== 'Doctor') {
            return res.status(403).json({ message: 'Only doctors can order lab tests' });
        }

        const { Patient_ID, Test_ID, waiveCommission } = req.body;
        const Doctor_ID = req.user.doctorId;
        const waive = waiveCommission ? 'Y' : 'N';

        if (!Patient_ID || !Test_ID) {
            return res.status(400).json({ message: 'Patient ID and Test ID are required' });
        }

        const result = await executeQuery(
            `INSERT INTO LAB_TEST_RECORD (patient_id, doctor_id, test_id, waive_commission, payment_status, status)
             VALUES (?, ?, ?, ?, 'Unpaid', 'Pending')`,
            [Patient_ID, Doctor_ID, Test_ID, waive]
        );

        res.status(201).json({ message: 'Lab test ordered successfully', recordId: result.insertId });
    } catch (err) {
        console.error('Error ordering lab test:', err.message);
        res.status(500).json({ message: 'Server error ordering lab test' });
    }
};

// @route   POST /api/lab/records/:id/pay
// @desc    Pay for a lab test (Atomic transaction with financial ledger update)
// @access  Private (Patient only)
exports.payLabTest = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        if (req.user.role !== 'Patient') {
            return res.status(403).json({ message: 'Only patients can pay for lab tests' });
        }

        connection = await getConnection();
        await connection.beginTransaction();

        // 1. Get lab record details
        const recResult = await connection.execute(
            `SELECT r.record_id, r.test_id, r.doctor_id, r.patient_id, r.waive_commission, r.payment_status, t.test_fee 
             FROM LAB_TEST_RECORD r
             JOIN LAB_TEST t ON r.test_id = t.test_id
             WHERE r.record_id = ? AND r.patient_id = ?`,
            [parseInt(id, 10), req.user.patientId]
        );

        if (recResult.rows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Lab test not found' });
        }

        const record = recResult.rows[0];
        if (record.PAYMENT_STATUS === 'Paid') {
            await connection.rollback();
            return res.status(400).json({ message: 'Lab test is already paid' });
        }

        const fee = parseFloat(record.TEST_FEE);
        let doctorAmount = 0;
        let adminAmount = Math.ceil(fee * 0.75);
        let totalAmount = Math.ceil(fee * 0.75);

        if (record.WAIVE_COMMISSION === 'N') {
            doctorAmount = Math.ceil(fee * 0.25);
            totalAmount = fee;
            adminAmount = fee - doctorAmount; // Ensure exact split
        }

        // 2. Update payment status → moves to "Awaiting Result"
        await connection.execute(
            `UPDATE LAB_TEST_RECORD SET payment_status = 'Paid', status = 'Awaiting Result' WHERE record_id = ?`,
            [parseInt(id, 10)]
        );

        // 3. Insert into financial ledger
        await connection.execute(
            `INSERT INTO FINANCIAL_LEDGER (transaction_type, reference_id, patient_id, doctor_id, total_amount, doctor_amount, admin_amount, is_cleared)
             VALUES ('Lab Test', ?, ?, ?, ?, ?, ?, 'N')`,
            [parseInt(id, 10), record.PATIENT_ID, record.DOCTOR_ID, totalAmount, doctorAmount, adminAmount]
        );

        await connection.commit();
        res.json({ message: 'Payment successful. Test sent to lab.' });
    } catch (err) {
        if (connection) {
            try { await connection.rollback(); } catch (e) { /* ignore */ }
        }
        console.error('Error paying for lab test:', err.message);
        res.status(500).json({ message: 'Server error processing lab payment' });
    } finally {
        if (connection) {
            try { connection.release(); } catch (e) { /* ignore */ }
        }
    }
};

// @route   PUT /api/lab/records/:id/complete
// @desc    Complete a lab test and submit report (Lab role only)
// @access  Private (Lab only)
exports.completeLabTest = async (req, res) => {
    try {
        if (req.user.role !== 'Lab') {
            return res.status(403).json({ message: 'Only lab technicians can complete lab tests' });
        }

        const { id } = req.params;
        const { Result_Details } = req.body;

        if (!Result_Details || !Result_Details.trim()) {
            return res.status(400).json({ message: 'Result details are required' });
        }

        const result = await executeQuery(
            `UPDATE LAB_TEST_RECORD 
             SET result_details = ?, status = 'Completed', report_date = NOW()
             WHERE record_id = ? AND payment_status = 'Paid'`,
            [Result_Details.trim(), parseInt(id, 10)]
        );

        // Fix silent failure
        if (result.rowsAffected === 0) {
            return res.status(400).json({ message: 'Lab test record not found, or it has not been paid for yet' });
        }

        res.json({ message: 'Lab report submitted successfully' });
    } catch (err) {
        console.error('Error completing lab test:', err.message);
        res.status(500).json({ message: 'Server error submitting lab report' });
    }
};

// @route   PUT /api/lab/records/:id/result
// @desc    Update lab test result
// @access  Private (Admin, Doctor, Lab)
exports.updateLabResult = async (req, res) => {
    try {
        if (req.user.role === 'Patient') {
            return res.status(403).json({ message: 'Patients cannot update lab results' });
        }

        const { id } = req.params;
        const { Result_Details, Status } = req.body;

        const result = await executeQuery(
            `UPDATE LAB_TEST_RECORD 
             SET result_details = ?, status = ?, report_date = NOW()
             WHERE record_id = ?`,
            [Result_Details || null, Status || 'Completed', parseInt(id, 10)]
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({ message: 'Lab test record not found' });
        }

        res.json({ message: 'Lab result updated successfully' });
    } catch (err) {
        console.error('Error updating lab result:', err.message);
        res.status(500).json({ message: 'Server error updating lab result' });
    }
};

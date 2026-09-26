const { executeQuery } = require('../config/db');

// @route   GET /api/patients
// @desc    Get all patients
// @access  Private (Admin, Doctor)
exports.getPatients = async (req, res) => {
    try {
        const result = await executeQuery(`SELECT * FROM PATIENT ORDER BY name`);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching patients:', err.message);
        res.status(500).json({ message: 'Server error retrieving patients' });
    }
};

// @route   GET /api/patients/:id
// @desc    Get patient by ID
// @access  Private (Admin, Doctor, Patient themselves)
exports.getPatientById = async (req, res) => {
    try {
        // Authorization check: patient can only view their own profile
        if (req.user.role === 'Patient' && String(req.user.patientId) !== String(req.params.id)) {
            return res.status(403).json({ message: 'Access denied: cannot view another patient profile' });
        }

        const result = await executeQuery(`SELECT * FROM PATIENT WHERE patient_id = ?`, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching patient by id:', err.message);
        res.status(500).json({ message: 'Server error retrieving patient' });
    }
};

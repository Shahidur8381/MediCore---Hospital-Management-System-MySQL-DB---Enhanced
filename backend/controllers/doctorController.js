const { executeQuery } = require('../config/db');

// @route   GET /api/doctors
// @desc    Get all doctors
// @access  Public or Private
exports.getDoctors = async (req, res) => {
    try {
        const result = await executeQuery(`
            SELECT d.*, dept.department_name 
            FROM DOCTOR d
            LEFT JOIN DEPARTMENT dept ON d.department_id = dept.department_id
            ORDER BY d.name
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching doctors:', err.message);
        res.status(500).json({ message: 'Server error retrieving doctors' });
    }
};

// @route   GET /api/doctors/:id
// @desc    Get doctor by ID
// @access  Public or Private
exports.getDoctorById = async (req, res) => {
    try {
        const result = await executeQuery(`
            SELECT d.*, dept.department_name 
            FROM DOCTOR d
            LEFT JOIN DEPARTMENT dept ON d.department_id = dept.department_id
            WHERE d.doctor_id = ?
        `, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching doctor by id:', err.message);
        res.status(500).json({ message: 'Server error retrieving doctor' });
    }
};

// @route   PUT /api/doctors/:id
// @desc    Update a doctor
// @access  Private (Admin)
exports.updateDoctor = async (req, res) => {
    const { departmentId, name, gender, dob, specialization, qualification, phone, email, fee, status } = req.body;
    
    try {
        const formattedDob = dob ? (dob.includes('T') ? dob.split('T')[0] : dob) : null;

        const result = await executeQuery(
            `UPDATE DOCTOR SET 
                department_id = ?, 
                name = ?, 
                gender = ?, 
                date_of_birth = ?, 
                specialization = ?, 
                qualification = ?, 
                phone = ?, 
                email = ?, 
                consultation_fee = ?,
                status = ?
             WHERE doctor_id = ?`,
            [departmentId, name, gender, formattedDob, specialization, qualification, phone, email, fee, status, req.params.id]
        );
        
        if (result.rowsAffected === 0) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        res.json({ message: 'Doctor updated successfully' });
    } catch (err) {
        console.error('Error updating doctor:', err.message);
        res.status(500).json({ message: 'Server error updating doctor' });
    }
};

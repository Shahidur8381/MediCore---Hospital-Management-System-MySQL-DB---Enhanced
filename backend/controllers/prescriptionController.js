const { executeQuery, getConnection } = require('../config/db');
const { generatePrescriptionPdfStream } = require('../services/pdfService');

// @route   GET /api/prescriptions/:appointmentId
// @desc    Get prescription for a specific appointment
// @access  Private
exports.getPrescriptionByAppointmentId = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        const result = await executeQuery(
            `SELECT p.*, d.name as doctor_name, pat.name as patient_name
             FROM PRESCRIPTION p
             JOIN DOCTOR d ON p.doctor_id = d.doctor_id
             JOIN PATIENT pat ON p.patient_id = pat.patient_id
             WHERE p.appointment_id = ?`,
            [appointmentId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        const prescription = result.rows[0];

        // Authorization check: only the relevant patient, doctor, or admin can view
        if (req.user.role === 'Patient' && String(req.user.patientId) !== String(prescription.PATIENT_ID)) {
            return res.status(403).json({ message: 'Access denied: You cannot view another patient prescription' });
        }
        if (req.user.role === 'Doctor' && String(req.user.doctorId) !== String(prescription.DOCTOR_ID)) {
            return res.status(403).json({ message: 'Access denied: You cannot view another doctor prescription' });
        }

        res.json(prescription);
    } catch (err) {
        console.error('Error fetching prescription:', err.message);
        res.status(500).json({ message: 'Server error retrieving prescription' });
    }
};

// @route   GET /api/prescriptions/patient/all
// @desc    Get all prescriptions for the logged-in patient
// @access  Private (Patient only)
exports.getPatientPrescriptions = async (req, res) => {
    try {
        if (req.user.role !== 'Patient') {
             return res.status(403).json({ message: 'Access denied: Patient role required' });
        }
        
        const result = await executeQuery(
            `SELECT p.*, d.name as doctor_name, a.appointment_date
             FROM PRESCRIPTION p
             JOIN DOCTOR d ON p.doctor_id = d.doctor_id
             JOIN APPOINTMENT a ON p.appointment_id = a.appointment_id
             WHERE p.patient_id = ?
             ORDER BY p.prescription_date DESC`,
            [req.user.patientId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching patient prescriptions:', err.message);
        res.status(500).json({ message: 'Server error retrieving prescriptions' });
    }
};

// @route   POST /api/prescriptions
// @desc    Create a new prescription (atomic transaction with appointment completion)
// @access  Private (Doctor only)
exports.createPrescription = async (req, res) => {
    let connection;
    try {
        if (req.user.role !== 'Doctor') {
            return res.status(403).json({ message: 'Only doctors can write prescriptions' });
        }

        const { Appointment_ID, Patient_ID, Diagnosis, Medicines, Notes } = req.body;
        const Doctor_ID = req.user.doctorId;

        if (!Appointment_ID || !Patient_ID || !Diagnosis) {
            return res.status(400).json({ message: 'Appointment ID, Patient ID, and Diagnosis are required' });
        }

        connection = await getConnection();
        await connection.beginTransaction();

        await connection.execute(
            `INSERT INTO PRESCRIPTION (appointment_id, patient_id, doctor_id, diagnosis, medicines, notes)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [Appointment_ID, Patient_ID, Doctor_ID, Diagnosis, Medicines || null, Notes || null]
        );
        
        // Update appointment status to Completed
        await connection.execute(
            `UPDATE APPOINTMENT SET status = 'Completed' WHERE appointment_id = ?`,
            [Appointment_ID]
        );

        await connection.commit();
        res.status(201).json({ message: 'Prescription created successfully' });
    } catch (err) {
        if (connection) {
            try { await connection.rollback(); } catch (e) { /* ignore */ }
        }
        console.error('Error creating prescription:', err.message);
        res.status(500).json({ message: 'Server error creating prescription' });
    } finally {
        if (connection) {
            try { connection.release(); } catch (e) { /* ignore */ }
        }
    }
};

// @route   GET /api/prescriptions/:appointmentId/pdf
// @desc    Generate and stream printable prescription PDF using @react-pdf/renderer
// @access  Private (Authorized Patient, Doctor, Admin)
exports.downloadPrescriptionPdf = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        // 1. Fetch prescription
        const rxRes = await executeQuery(
            `SELECT p.*, d.name as doctor_name, pat.name as patient_name
             FROM PRESCRIPTION p
             JOIN DOCTOR d ON p.doctor_id = d.doctor_id
             JOIN PATIENT pat ON p.patient_id = pat.patient_id
             WHERE p.appointment_id = ?`,
            [appointmentId]
        );

        if (rxRes.rows.length === 0) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        const prescription = rxRes.rows[0];

        // 2. Authorization check
        if (req.user.role === 'Patient' && String(req.user.patientId) !== String(prescription.PATIENT_ID)) {
            return res.status(403).json({ message: 'Access denied: You cannot download another patient prescription' });
        }
        if (req.user.role === 'Doctor' && String(req.user.doctorId) !== String(prescription.DOCTOR_ID)) {
            return res.status(403).json({ message: 'Access denied: You cannot download another doctor prescription' });
        }

        // 3. Fetch full doctor profile (with department)
        const docRes = await executeQuery(
            `SELECT d.*, dept.department_name 
             FROM DOCTOR d 
             LEFT JOIN DEPARTMENT dept ON d.department_id = dept.department_id 
             WHERE d.doctor_id = ?`,
            [prescription.DOCTOR_ID]
        );
        const doctor = docRes.rows[0] || {};

        // 4. Fetch full patient profile
        const patRes = await executeQuery(
            `SELECT * FROM PATIENT WHERE patient_id = ?`,
            [prescription.PATIENT_ID]
        );
        const patient = patRes.rows[0] || {};

        // 5. Generate PDF Stream
        const pdfStream = await generatePrescriptionPdfStream({
            prescription,
            doctor,
            patient
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="MediCore-Prescription-${appointmentId}.pdf"`);

        pdfStream.pipe(res);
    } catch (err) {
        console.error('Error generating prescription PDF:', err.message);
        res.status(500).json({ message: 'Server error generating prescription PDF' });
    }
};

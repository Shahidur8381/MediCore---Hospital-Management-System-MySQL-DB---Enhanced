const { executeQuery, getConnection } = require('../config/db');

// @route   GET /api/appointments
// @desc    Get all appointments (Filtered by role)
// @access  Private
exports.getAppointments = async (req, res) => {
    try {
        let query = `
            SELECT a.appointment_id, a.patient_id, a.doctor_id, a.appointment_date, 
                   a.queue_number, a.booking_date, a.status,
                   p.name as patient_name, d.name as doctor_name, dept.department_name
            FROM APPOINTMENT a
            JOIN PATIENT p ON a.patient_id = p.patient_id
            JOIN DOCTOR d ON a.doctor_id = d.doctor_id
            LEFT JOIN DEPARTMENT dept ON d.department_id = dept.department_id
        `;
        let params = [];

        if (req.user.role === 'Patient') {
            query += ' WHERE a.patient_id = ?';
            params.push(req.user.patientId);
        } else if (req.user.role === 'Doctor') {
            query += ' WHERE a.doctor_id = ?';
            params.push(req.user.doctorId);
        }

        query += ' ORDER BY a.appointment_date DESC, a.queue_number ASC';

        const result = await executeQuery(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error getting appointments:', err.message);
        res.status(500).json({ message: 'Server error retrieving appointments' });
    }
};

// @route   GET /api/appointments/stats
// @desc    Get appointment stats for current user
// @access  Private
exports.getStats = async (req, res) => {
    try {
        if (req.user.role === 'Patient') {
            const [aptRes, labRes, rxRes] = await Promise.all([
                executeQuery('SELECT COUNT(*) AS cnt FROM APPOINTMENT WHERE patient_id = ?', [req.user.patientId]),
                executeQuery('SELECT COUNT(*) AS cnt FROM LAB_TEST_RECORD WHERE patient_id = ?', [req.user.patientId]),
                executeQuery('SELECT COUNT(*) AS cnt FROM PRESCRIPTION WHERE patient_id = ?', [req.user.patientId]),
            ]);
            return res.json({
                appointments: aptRes.rows[0]?.CNT || 0,
                labTests: labRes.rows[0]?.CNT || 0,
                prescriptions: rxRes.rows[0]?.CNT || 0,
            });
        }

        if (req.user.role === 'Doctor') {
            const [todayRes, totalRxRes, totalLabRes] = await Promise.all([
                executeQuery(
                    `SELECT COUNT(*) AS cnt FROM APPOINTMENT 
                     WHERE doctor_id = ? AND DATE(appointment_date) = CURDATE() AND status != 'Cancelled'`,
                    [req.user.doctorId]
                ),
                executeQuery('SELECT COUNT(*) AS cnt FROM PRESCRIPTION WHERE doctor_id = ?', [req.user.doctorId]),
                executeQuery('SELECT COUNT(*) AS cnt FROM LAB_TEST_RECORD WHERE doctor_id = ?', [req.user.doctorId]),
            ]);
            return res.json({
                todayAppointments: todayRes.rows[0]?.CNT || 0,
                totalPrescriptions: totalRxRes.rows[0]?.CNT || 0,
                totalLabOrders: totalLabRes.rows[0]?.CNT || 0,
            });
        }

        res.json({});
    } catch (err) {
        console.error('Error getting stats:', err.message);
        res.status(500).json({ message: 'Server error retrieving statistics' });
    }
};

// @route   GET /api/appointments/availability
// @desc    Get real-time slot and queue availability for doctor on a specific date
// @access  Private
exports.getDoctorAvailability = async (req, res) => {
    try {
        const { doctorId, date } = req.query;
        if (!doctorId || !date) {
            return res.status(400).json({ message: 'doctorId and date query parameters are required' });
        }

        const formattedDate = date.includes('T') ? date.split('T')[0] : date;

        const [aptRes, docRes] = await Promise.all([
            executeQuery(
                `SELECT appointment_id, patient_id, queue_number, status 
                 FROM APPOINTMENT 
                 WHERE doctor_id = ? AND DATE(appointment_date) = ? AND status != 'Cancelled'`,
                [parseInt(doctorId, 10), formattedDate]
            ),
            executeQuery(
                `SELECT doctor_id, name, consultation_fee, status FROM DOCTOR WHERE doctor_id = ?`,
                [parseInt(doctorId, 10)]
            )
        ]);

        if (docRes.rows.length === 0) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        const bookedRows = aptRes.rows;
        const bookedTokens = new Set(bookedRows.map(r => r.QUEUE_NUMBER));
        const userBooked = req.user.role === 'Patient' && bookedRows.some(r => String(r.PATIENT_ID) === String(req.user.patientId));

        // 12 consultation slots matching queue tokens
        const standardSlots = [
            { token: 1, time: '09:00 AM', session: 'Morning' },
            { token: 2, time: '09:30 AM', session: 'Morning' },
            { token: 3, time: '10:00 AM', session: 'Morning' },
            { token: 4, time: '10:30 AM', session: 'Morning' },
            { token: 5, time: '11:00 AM', session: 'Morning' },
            { token: 6, time: '11:30 AM', session: 'Morning' },
            { token: 7, time: '02:00 PM', session: 'Afternoon' },
            { token: 8, time: '02:30 PM', session: 'Afternoon' },
            { token: 9, time: '03:00 PM', session: 'Afternoon' },
            { token: 10, time: '03:30 PM', session: 'Afternoon' },
            { token: 11, time: '04:00 PM', session: 'Evening' },
            { token: 12, time: '04:30 PM', session: 'Evening' },
        ];

        const todayStr = new Date().toISOString().split('T')[0];
        const isPastDate = formattedDate < todayStr;

        const slots = standardSlots.map(slot => {
            let status = 'available';
            if (isPastDate) {
                status = 'unavailable';
            } else if (bookedTokens.has(slot.token)) {
                status = 'booked';
            }
            return {
                ...slot,
                status
            };
        });

        res.json({
            doctorId: parseInt(doctorId, 10),
            date: formattedDate,
            doctorName: docRes.rows[0].NAME,
            consultationFee: docRes.rows[0].CONSULTATION_FEE,
            alreadyBookedByYou: userBooked,
            totalBooked: bookedRows.length,
            availableSlotsCount: slots.filter(s => s.status === 'available').length,
            slots
        });
    } catch (err) {
        console.error('Error fetching doctor availability:', err.message);
        res.status(500).json({ message: 'Server error retrieving availability' });
    }
};

// @route   POST /api/appointments
// @desc    Book a new appointment (queue-based)
// @access  Private (Patient only)
exports.createAppointment = async (req, res) => {
    let connection;
    try {
        const { Doctor_ID, Appointment_Date } = req.body;
        const Patient_ID = req.user.patientId;

        if (req.user.role !== 'Patient') {
            return res.status(403).json({ message: 'Only patients can book appointments directly' });
        }

        if (!Doctor_ID || !Appointment_Date) {
            return res.status(400).json({ message: 'Doctor ID and Appointment Date are required' });
        }

        // Clean date format if passed with time
        const formattedDate = Appointment_Date.includes('T') ? Appointment_Date.split('T')[0] : Appointment_Date;

        connection = await getConnection();
        await connection.beginTransaction();

        // 1. Get the doctor's consultation fee
        const docResult = await connection.execute(
            `SELECT consultation_fee FROM DOCTOR WHERE doctor_id = ? AND status = 'Active'`,
            [Doctor_ID]
        );

        if (docResult.rows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Active doctor not found' });
        }

        // 2. Check patient hasn't already booked this doctor on the same date
        const dupeCheck = await connection.execute(
            `SELECT appointment_id FROM APPOINTMENT 
             WHERE doctor_id = ? AND DATE(appointment_date) = ? AND patient_id = ? AND status != 'Cancelled'`,
            [Doctor_ID, formattedDate, Patient_ID]
        );

        if (dupeCheck.rows.length > 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'You already have an appointment with this doctor on this date.' });
        }

        // 3. Calculate next queue number
        const queueResult = await connection.execute(
            `SELECT IFNULL(MAX(queue_number), 0) + 1 AS next_queue 
             FROM APPOINTMENT 
             WHERE doctor_id = ? AND DATE(appointment_date) = ? AND status != 'Cancelled'`,
            [Doctor_ID, formattedDate]
        );
        const queueNumber = queueResult.rows[0].NEXT_QUEUE;

        const fee = parseFloat(docResult.rows[0].CONSULTATION_FEE);
        const doctorAmount = Math.ceil(fee * 0.8);
        const adminAmount = fee - doctorAmount; // 80/20 split

        // 4. Insert appointment
        const aptResult = await connection.execute(
            `INSERT INTO APPOINTMENT (patient_id, doctor_id, appointment_date, queue_number, status)
             VALUES (?, ?, ?, ?, 'Pending')`,
            [Patient_ID, Doctor_ID, formattedDate, queueNumber]
        );

        const appointmentId = aptResult.insertId;

        // 5. Insert into financial ledger
        await connection.execute(
            `INSERT INTO FINANCIAL_LEDGER (transaction_type, reference_id, patient_id, doctor_id, total_amount, doctor_amount, admin_amount, is_cleared)
             VALUES ('Appointment', ?, ?, ?, ?, ?, ?, 'N')`,
            [appointmentId, Patient_ID, Doctor_ID, fee, doctorAmount, adminAmount]
        );

        await connection.commit();

        // Emit realtime Socket.IO notifications
        try {
            const { emitQueueUpdate, emitAppointmentStatusChange } = require('../socket');
            emitQueueUpdate(Doctor_ID, { appointmentId, queueNumber, status: 'Pending', type: 'new_booking' });
            emitAppointmentStatusChange(Patient_ID, Doctor_ID, { appointmentId, queueNumber, status: 'Pending' });
        } catch (e) {
            console.warn('Socket notification error (non-fatal):', e.message);
        }

        res.status(201).json({ message: 'Appointment booked successfully', queueNumber, appointmentId });
    } catch (err) {
        if (connection) {
            try { await connection.rollback(); } catch (e) { /* ignore */ }
        }
        console.error('Error booking appointment:', err.message);
        res.status(500).json({ message: 'Server error booking appointment' });
    } finally {
        if (connection) {
            try { connection.release(); } catch (e) { /* ignore */ }
        }
    }
};

// @route   PUT /api/appointments/:id/status
// @desc    Update appointment status
// @access  Private (Doctor, Admin)
exports.updateAppointmentStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;

        if (req.user.role === 'Patient') {
            return res.status(403).json({ message: 'Patients cannot update appointment status directly' });
        }

        const validStatuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'Waiting'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }

        const existingRes = await executeQuery(
            `SELECT appointment_id, patient_id, doctor_id, queue_number FROM APPOINTMENT WHERE appointment_id = ?`,
            [parseInt(id, 10)]
        );

        if (existingRes.rows.length === 0) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        const apt = existingRes.rows[0];

        const result = await executeQuery(
            `UPDATE APPOINTMENT SET status = ? WHERE appointment_id = ?`,
            [status, parseInt(id, 10)]
        );

        // Emit realtime Socket.IO status change
        try {
            const { emitAppointmentStatusChange } = require('../socket');
            emitAppointmentStatusChange(apt.PATIENT_ID, apt.DOCTOR_ID, {
                appointmentId: parseInt(id, 10),
                status,
                queueNumber: apt.QUEUE_NUMBER
            });
        } catch (e) {
            console.warn('Socket notification error (non-fatal):', e.message);
        }

        res.json({ message: 'Appointment status updated successfully' });
    } catch (err) {
        console.error('Error updating appointment status:', err.message);
        res.status(500).json({ message: 'Server error updating appointment status' });
    }
};

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { executeQuery, getConnection } = require('../config/db');
const { verifyAdminCode } = require('../utils/totp');

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('FATAL: JWT_SECRET environment variable is missing in production!');
        }
        return 'medicore_development_jwt_secret_key_2026';
    }
    return secret;
};

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
exports.login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        const result = await executeQuery(
            `SELECT user_id, doctor_id, patient_id, username, password_hash, role, status 
             FROM USER_ACCOUNT WHERE username = ?`,
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const user = result.rows[0];

        if (user.STATUS !== 'Active') {
            return res.status(403).json({ message: 'Account is inactive. Please contact support.' });
        }

        const isMatch = await bcrypt.compare(password, user.PASSWORD_HASH);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        let isGuestAdmin = false;
        
        if (user.ROLE === 'Admin') {
            isGuestAdmin = true; // Always start as guest until elevation
        }

        const payload = {
            user: {
                id: user.USER_ID,
                role: user.ROLE,
                username: user.USERNAME,
                doctorId: user.DOCTOR_ID,
                patientId: user.PATIENT_ID,
                isGuestAdmin: isGuestAdmin
            }
        };

        jwt.sign(
            payload,
            getJwtSecret(),
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: payload.user });
            }
        );
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ message: 'Server error during authentication' });
    }
};

// @route   POST /api/auth/verify-admin-token
// @desc    Elevate Guest Admin to Super Admin using TOTP
// @access  Private (Admin)
exports.verifyAdminToken = async (req, res) => {
    try {
        const { totpCode } = req.body;
        
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Not an admin account' });
        }
        
        if (!totpCode || !verifyAdminCode(totpCode)) {
            return res.status(401).json({ message: 'Invalid Authenticator Code' });
        }
        
        // Code is valid, issue new token with isGuestAdmin = false
        const payload = {
            user: {
                ...req.user,
                isGuestAdmin: false
            }
        };
        
        jwt.sign(
            payload,
            getJwtSecret(),
            { expiresIn: '1h' }, // 60 mins session
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: payload.user });
            }
        );
    } catch (err) {
        console.error('Elevation error:', err.message);
        res.status(500).json({ message: 'Server error during elevation' });
    }
};

// @route   POST /api/auth/register-patient
// @desc    Register a new patient
// @access  Public
exports.registerPatient = async (req, res) => {
    const { username, password, name, gender, dob, bloodGroup, phone, email, address, emergencyContact } = req.body;

    if (!username || !password || !name || !phone) {
        return res.status(400).json({ message: 'Username, password, full name, and phone number are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    let connection;
    try {
        // Check if username exists
        const userCheck = await executeQuery('SELECT user_id FROM USER_ACCOUNT WHERE username = ?', [username]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Check if phone already registered
        const phoneCheck = await executeQuery('SELECT patient_id FROM PATIENT WHERE phone = ?', [phone]);
        if (phoneCheck.rows.length > 0) {
            return res.status(400).json({ message: 'Phone number already registered' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        connection = await getConnection();
        await connection.beginTransaction();

        // Insert Patient
        const patientInsert = await connection.execute(
            `INSERT INTO PATIENT (name, gender, date_of_birth, blood_group, phone, email, address, emergency_contact) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, gender || null, dob || null, bloodGroup || null, phone, email || null, address || null, emergencyContact || null]
        );

        const patientId = patientInsert.insertId;

        // Insert User Account
        await connection.execute(
            `INSERT INTO USER_ACCOUNT (patient_id, username, password_hash, role, status) 
             VALUES (?, ?, ?, 'Patient', 'Active')`,
            [patientId, username, hashedPassword]
        );

        await connection.commit();
        res.status(201).json({ message: 'Patient registered successfully' });
    } catch (err) {
        if (connection) {
            try { await connection.rollback(); } catch (e) { /* ignore */ }
        }
        console.error('Patient registration error:', err.message);
        res.status(500).json({ message: err.message || 'Server error during registration' });
    } finally {
        if (connection) {
            try { connection.release(); } catch (e) { /* ignore */ }
        }
    }
};

// @route   POST /api/auth/register-doctor
// @desc    Register a new doctor (Admin only)
// @access  Private (Admin)
exports.registerDoctor = async (req, res) => {
    const { username, password, departmentId, name, gender, dob, specialization, qualification, phone, email, fee } = req.body;

    if (!username || !password || !name || !phone || !email || !fee) {
        return res.status(400).json({ message: 'Username, password, name, phone, email, and consultation fee are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    let connection;
    try {
        const userCheck = await executeQuery('SELECT user_id FROM USER_ACCOUNT WHERE username = ?', [username]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        connection = await getConnection();
        await connection.beginTransaction();

        const doctorInsert = await connection.execute(
            `INSERT INTO DOCTOR (department_id, name, gender, date_of_birth, specialization, qualification, phone, email, consultation_fee, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
            [departmentId || null, name, gender || null, dob || null, specialization || null, qualification || null, phone, email, fee]
        );

        const doctorId = doctorInsert.insertId;

        await connection.execute(
            `INSERT INTO USER_ACCOUNT (doctor_id, username, password_hash, role, status) 
             VALUES (?, ?, ?, 'Doctor', 'Active')`,
            [doctorId, username, hashedPassword]
        );

        await connection.commit();
        res.status(201).json({ message: 'Doctor registered successfully' });
    } catch (err) {
        if (connection) {
            try { await connection.rollback(); } catch (e) { /* ignore */ }
        }
        console.error('Doctor registration error:', err.message);
        res.status(500).json({ message: err.message || 'Server error during doctor registration' });
    } finally {
        if (connection) {
            try { connection.release(); } catch (e) { /* ignore */ }
        }
    }
};

// @route   GET /api/auth/me
// @desc    Get current user profile based on token
// @access  Private
exports.getMe = async (req, res) => {
    try {
        if (req.user.role === 'Admin') {
            return res.json({ id: req.user.id, role: req.user.role, username: req.user.username });
        }

        if (req.user.role === 'Doctor') {
            const result = await executeQuery(`
                SELECT d.*, dept.department_name 
                FROM DOCTOR d
                LEFT JOIN DEPARTMENT dept ON d.department_id = dept.department_id
                WHERE d.doctor_id = ?
            `, [req.user.doctorId]);
            return res.json({ id: req.user.id, role: req.user.role, username: req.user.username, profile: result.rows[0] });
        }

        if (req.user.role === 'Patient') {
            const result = await executeQuery('SELECT * FROM PATIENT WHERE patient_id = ?', [req.user.patientId]);
            return res.json({ id: req.user.id, role: req.user.role, username: req.user.username, profile: result.rows[0] });
        }

        if (req.user.role === 'Lab') {
            return res.json({ id: req.user.id, role: req.user.role, username: req.user.username });
        }

        res.status(404).json({ message: 'Profile not found' });
    } catch (err) {
        console.error('Get profile error:', err.message);
        res.status(500).json({ message: 'Server error retrieving profile' });
    }
};

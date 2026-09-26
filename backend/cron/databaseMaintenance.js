const cron = require('node-cron');
const bcrypt = require('bcryptjs');
const { executeQuery, getConnection } = require('../config/db');

// --- TASK 1: Add one patient every Friday to prevent database deletion ---
// Schedule: Every Friday at 12:00 PM (0 12 * * 5)
cron.schedule('0 12 * * 5', async () => {
    console.log('[CRON] Executing weekly database keep-alive (Creating dummy patient)...');
    let connection;
    try {
        const timestamp = Date.now();
        const username = `dummy_patient_${timestamp}`;
        const phone = `+88019${Math.floor(10000000 + Math.random() * 90000000)}`;
        const name = `Keep-Alive Patient ${new Date().toLocaleDateString()}`;
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        connection = await getConnection();
        await connection.beginTransaction();

        // 1. Insert into PATIENT table
        const patientInsert = await connection.execute(
            `INSERT INTO PATIENT (name, gender, date_of_birth, phone, email, address) 
             VALUES (?, 'Male', '1990-01-01', ?, ?, 'System Generated')`,
            [name, phone, `${username}@medicore.local`]
        );
        const patientId = patientInsert.insertId;

        // 2. Insert into USER_ACCOUNT table
        await connection.execute(
            `INSERT INTO USER_ACCOUNT (patient_id, username, password_hash, role, status) 
             VALUES (?, ?, ?, 'Patient', 'Active')`,
            [patientId, username, hashedPassword]
        );

        await connection.commit();
        console.log(`[CRON] Successfully created keep-alive patient: ${username}`);
    } catch (err) {
        if (connection) {
            try { await connection.rollback(); } catch (e) { /* ignore */ }
        }
        console.error('[CRON] Failed to create keep-alive patient:', err.message);
    } finally {
        if (connection) {
            try { connection.release(); } catch (e) { /* ignore */ }
        }
    }
});


// --- TASK 2: Delete temporary users every 3 months (Quarterly Cleanup) ---
// Schedule: At 00:00 on day-of-month 1 in Jan, Apr, Jul, Oct (0 0 1 1,4,7,10 *)
cron.schedule('0 0 1 1,4,7,10 *', async () => {
    console.log('[CRON] Executing quarterly database cleanup (Deleting temporary users)...');
    let connection;
    try {
        // List of usernames that are strictly protected from deletion
        const protectedUsernames = [
            'admin', 
            'doctor1', 'doctor2', 'doctor3', 'doctor4', 'doctor5',
            'patient1', 'patient2', 'patient3', 'patient4', 'patient5'
        ];

        // Create a comma-separated list of quoted strings for the SQL IN clause
        const placeholders = protectedUsernames.map(() => '?').join(',');

        connection = await getConnection();
        await connection.beginTransaction();

        // Step 1: Identify all patient_ids and doctor_ids that will be deleted
        const usersToDelete = await connection.execute(
            `SELECT user_id, patient_id, doctor_id FROM USER_ACCOUNT WHERE username NOT IN (${placeholders})`,
            protectedUsernames
        );

        const patientIds = usersToDelete.rows.filter(u => u.PATIENT_ID).map(u => u.PATIENT_ID);
        const doctorIds = usersToDelete.rows.filter(u => u.DOCTOR_ID).map(u => u.DOCTOR_ID);

        if (usersToDelete.rows.length === 0) {
            console.log('[CRON] No temporary users found to delete.');
            await connection.rollback();
            return;
        }
        
        // Step 2: Delete from USER_ACCOUNT (Wait, they have cascading deletes or we need to delete from dependent tables like APPOINTMENT, PRESCRIPTION too)
        
        // We will just delete from USER_ACCOUNT, PATIENT, and DOCTOR. If there are foreign key constraints like appointments, we will need to delete those first.
        // Let's execute raw SQL to delete all associated records
        
        if (patientIds.length > 0) {
            const pPlaceholders = patientIds.map(() => '?').join(',');
            await connection.execute(`DELETE FROM PRESCRIPTION WHERE appointment_id IN (SELECT appointment_id FROM APPOINTMENT WHERE patient_id IN (${pPlaceholders}))`, patientIds);
            await connection.execute(`DELETE FROM BILLING WHERE patient_id IN (${pPlaceholders})`, patientIds);
            await connection.execute(`DELETE FROM LAB_REPORT WHERE patient_id IN (${pPlaceholders})`, patientIds);
            await connection.execute(`DELETE FROM APPOINTMENT WHERE patient_id IN (${pPlaceholders})`, patientIds);
            await connection.execute(`DELETE FROM MEDICAL_RECORD WHERE patient_id IN (${pPlaceholders})`, patientIds);
        }

        if (doctorIds.length > 0) {
            const dPlaceholders = doctorIds.map(() => '?').join(',');
            await connection.execute(`DELETE FROM DOCTOR_SCHEDULE WHERE doctor_id IN (${dPlaceholders})`, doctorIds);
            await connection.execute(`DELETE FROM APPOINTMENT WHERE doctor_id IN (${dPlaceholders})`, doctorIds);
        }

        // Now delete from USER_ACCOUNT
        const deletedUsers = await connection.execute(
            `DELETE FROM USER_ACCOUNT WHERE username NOT IN (${placeholders})`,
            protectedUsernames
        );

        // Delete from PATIENT
        if (patientIds.length > 0) {
            const pPlaceholders = patientIds.map(() => '?').join(',');
            await connection.execute(`DELETE FROM PATIENT WHERE patient_id IN (${pPlaceholders})`, patientIds);
        }

        // Delete from DOCTOR
        if (doctorIds.length > 0) {
            const dPlaceholders = doctorIds.map(() => '?').join(',');
            await connection.execute(`DELETE FROM DOCTOR WHERE doctor_id IN (${dPlaceholders})`, doctorIds);
        }

        await connection.commit();
        console.log(`[CRON] Cleanup successful. Deleted ${deletedUsers.rowsAffected} temporary accounts.`);
    } catch (err) {
        if (connection) {
            try { await connection.rollback(); } catch (e) { /* ignore */ }
        }
        console.error('[CRON] Failed to execute quarterly cleanup:', err.message);
    } finally {
        if (connection) {
            try { connection.release(); } catch (e) { /* ignore */ }
        }
    }
});

console.log('[CRON] Database maintenance schedules initialized.');

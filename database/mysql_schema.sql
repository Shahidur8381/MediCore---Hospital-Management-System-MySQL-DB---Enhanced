-- MediCore Hospital Management System: MySQL 8 Schema
-- Compatible with MySQL 8.0+, Aiven MySQL, TiDB, and local MySQL instances.

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS FINANCIAL_LEDGER;
DROP TABLE IF EXISTS LAB_TEST_RECORD;
DROP TABLE IF EXISTS LAB_TEST;
DROP TABLE IF EXISTS PRESCRIPTION;
DROP TABLE IF EXISTS APPOINTMENT;
DROP TABLE IF EXISTS USER_ACCOUNT;
DROP TABLE IF EXISTS PATIENT;
DROP TABLE IF EXISTS DOCTOR;
DROP TABLE IF EXISTS DEPARTMENT;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. DEPARTMENT
CREATE TABLE DEPARTMENT (
    department_id INT AUTO_INCREMENT PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE,
    department_head VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. DOCTOR
CREATE TABLE DOCTOR (
    doctor_id INT AUTO_INCREMENT PRIMARY KEY,
    department_id INT,
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(10),
    date_of_birth DATE,
    specialization VARCHAR(100),
    qualification VARCHAR(100),
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    consultation_fee DECIMAL(10, 2) NOT NULL,
    joining_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Active',
    CONSTRAINT fk_doc_dept FOREIGN KEY (department_id) 
        REFERENCES DEPARTMENT (department_id) 
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. PATIENT
CREATE TABLE PATIENT (
    patient_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(10),
    date_of_birth DATE,
    blood_group VARCHAR(5),
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(100),
    address VARCHAR(255),
    emergency_contact VARCHAR(20),
    registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. USER_ACCOUNT
CREATE TABLE USER_ACCOUNT (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NULL,
    patient_id INT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL, -- 'Admin', 'Doctor', 'Patient', 'Lab'
    status VARCHAR(20) DEFAULT 'Active',
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_doctor FOREIGN KEY (doctor_id) 
        REFERENCES DOCTOR (doctor_id) 
        ON DELETE SET NULL,
    CONSTRAINT fk_user_patient FOREIGN KEY (patient_id) 
        REFERENCES PATIENT (patient_id) 
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. APPOINTMENT
CREATE TABLE APPOINTMENT (
    appointment_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    appointment_date DATE NOT NULL,
    booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Confirmed', 'Completed', 'Cancelled', 'Waiting'
    queue_number INT DEFAULT 0,
    CONSTRAINT fk_apt_patient FOREIGN KEY (patient_id) 
        REFERENCES PATIENT (patient_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_apt_doctor FOREIGN KEY (doctor_id) 
        REFERENCES DOCTOR (doctor_id) 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. PRESCRIPTION
CREATE TABLE PRESCRIPTION (
    prescription_id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    prescription_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    diagnosis VARCHAR(255),
    medicines TEXT,
    notes TEXT,
    CONSTRAINT fk_rx_appointment FOREIGN KEY (appointment_id) 
        REFERENCES APPOINTMENT (appointment_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_rx_patient FOREIGN KEY (patient_id) 
        REFERENCES PATIENT (patient_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_rx_doctor FOREIGN KEY (doctor_id) 
        REFERENCES DOCTOR (doctor_id) 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. LAB_TEST
CREATE TABLE LAB_TEST (
    test_id INT AUTO_INCREMENT PRIMARY KEY,
    test_name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    test_fee DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'Available'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. LAB_TEST_RECORD
CREATE TABLE LAB_TEST_RECORD (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    test_id INT NOT NULL,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    result_details TEXT,
    report_date DATETIME NULL,
    status VARCHAR(30) DEFAULT 'Pending', -- 'Pending', 'Awaiting Result', 'Completed'
    waive_commission CHAR(1) DEFAULT 'N',
    payment_status VARCHAR(20) DEFAULT 'Unpaid', -- 'Unpaid', 'Paid'
    CONSTRAINT fk_labrec_patient FOREIGN KEY (patient_id) 
        REFERENCES PATIENT (patient_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_labrec_doctor FOREIGN KEY (doctor_id) 
        REFERENCES DOCTOR (doctor_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_labrec_test FOREIGN KEY (test_id) 
        REFERENCES LAB_TEST (test_id) 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. FINANCIAL_LEDGER
CREATE TABLE FINANCIAL_LEDGER (
    ledger_id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_type VARCHAR(50) NOT NULL, -- 'Appointment', 'Lab Test'
    reference_id INT NOT NULL,
    patient_id INT NOT NULL,
    doctor_id INT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    doctor_amount DECIMAL(10, 2) NOT NULL,
    admin_amount DECIMAL(10, 2) NOT NULL,
    transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_cleared CHAR(1) DEFAULT 'N', -- 'N' (Available), 'P' (Pending), 'Y' (Cleared)
    CONSTRAINT fk_ledger_patient FOREIGN KEY (patient_id) 
        REFERENCES PATIENT (patient_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_ledger_doctor FOREIGN KEY (doctor_id) 
        REFERENCES DOCTOR (doctor_id) 
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. PAYMENT_TRANSACTION (SSLCommerz Sandbox & Audit Log)
CREATE TABLE IF NOT EXISTS PAYMENT_TRANSACTION (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    tran_id VARCHAR(100) NOT NULL UNIQUE,
    val_id VARCHAR(100) NULL,
    patient_id INT NOT NULL,
    item_type VARCHAR(50) NOT NULL, -- 'Appointment', 'Lab Test'
    item_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'BDT',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'VALID', 'FAILED', 'CANCELLED'
    bank_tran_id VARCHAR(100) NULL,
    card_type VARCHAR(50) NULL,
    card_issuer VARCHAR(100) NULL,
    ipn_payload TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    appointment_id INT NULL,
    lab_record_id INT NULL,
    CONSTRAINT fk_pay_patient FOREIGN KEY (patient_id) 
        REFERENCES PATIENT (patient_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_pay_appointment FOREIGN KEY (appointment_id) 
        REFERENCES APPOINTMENT (appointment_id) 
        ON DELETE SET NULL,
    CONSTRAINT fk_pay_labrecord FOREIGN KEY (lab_record_id) 
        REFERENCES LAB_TEST_RECORD (record_id) 
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


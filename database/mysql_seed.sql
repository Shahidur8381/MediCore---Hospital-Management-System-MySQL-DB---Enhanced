-- MediCore Hospital Management System: MySQL 8 Seed Data
-- Default password for all seeded accounts is 'MediCore'

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE FINANCIAL_LEDGER;
TRUNCATE TABLE LAB_TEST_RECORD;
TRUNCATE TABLE LAB_TEST;
TRUNCATE TABLE PRESCRIPTION;
TRUNCATE TABLE APPOINTMENT;
TRUNCATE TABLE USER_ACCOUNT;
TRUNCATE TABLE PATIENT;
TRUNCATE TABLE DOCTOR;
TRUNCATE TABLE DEPARTMENT;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. Insert Default Department
INSERT INTO DEPARTMENT (department_id, department_name, department_head)
VALUES (100, 'General Medicine', 'Dr. Smith');

-- 2. Insert Admin Account
INSERT INTO USER_ACCOUNT (user_id, username, password_hash, role, status, created_date)
VALUES (100, 'admin', '$2b$10$snyUAIAGmA9WYniWwzRnre8ReuMwcCl0Wy0j07x.auj6fAdakcsyq', 'Admin', 'Active', '2026-06-21 00:00:00');

-- 3. Insert Lab Technician Account
INSERT INTO USER_ACCOUNT (user_id, username, password_hash, role, status, created_date)
VALUES (301, 'lab', '$2b$10$snyUAIAGmA9WYniWwzRnre8ReuMwcCl0Wy0j07x.auj6fAdakcsyq', 'Lab', 'Active', '2026-06-21 00:00:00');

-- 4. Insert 5 Dummy Doctors
INSERT INTO DOCTOR (doctor_id, department_id, name, gender, phone, email, consultation_fee, joining_date, status)
VALUES 
(101, 100, 'Doctor 1', 'Male', '555-0101', 'doctor1@medicore.com', 500.00, '2026-06-21 00:00:00', 'Active'),
(102, 100, 'Doctor 2', 'Female', '555-0102', 'doctor2@medicore.com', 500.00, '2026-06-21 00:00:00', 'Active'),
(103, 100, 'Doctor 3', 'Male', '555-0103', 'doctor3@medicore.com', 500.00, '2026-06-21 00:00:00', 'Active'),
(104, 100, 'Doctor 4', 'Female', '555-0104', 'doctor4@medicore.com', 500.00, '2026-06-21 00:00:00', 'Active'),
(105, 100, 'Doctor 5', 'Male', '555-0105', 'doctor5@medicore.com', 500.00, '2026-06-21 00:00:00', 'Active');

INSERT INTO USER_ACCOUNT (user_id, doctor_id, username, password_hash, role, status, created_date)
VALUES 
(101, 101, 'Doctor1', '$2b$10$snyUAIAGmA9WYniWwzRnre8ReuMwcCl0Wy0j07x.auj6fAdakcsyq', 'Doctor', 'Active', '2026-06-21 00:00:00'),
(102, 102, 'Doctor2', '$2b$10$snyUAIAGmA9WYniWwzRnre8ReuMwcCl0Wy0j07x.auj6fAdakcsyq', 'Doctor', 'Active', '2026-06-21 00:00:00'),
(103, 103, 'Doctor3', '$2b$10$snyUAIAGmA9WYniWwzRnre8ReuMwcCl0Wy0j07x.auj6fAdakcsyq', 'Doctor', 'Active', '2026-06-21 00:00:00'),
(104, 104, 'Doctor4', '$2b$10$snyUAIAGmA9WYniWwzRnre8ReuMwcCl0Wy0j07x.auj6fAdakcsyq', 'Doctor', 'Active', '2026-06-21 00:00:00'),
(105, 105, 'Doctor5', '$2b$10$snyUAIAGmA9WYniWwzRnre8ReuMwcCl0Wy0j07x.auj6fAdakcsyq', 'Doctor', 'Active', '2026-06-21 00:00:00');

-- 5. Insert 5 Dummy Patients
INSERT INTO PATIENT (patient_id, name, gender, phone, email, registration_date, status)
VALUES 
(201, 'Patient 1', 'Male', '555-0201', 'patient1@medicore.com', '2026-06-21 00:00:00', 'Active'),
(202, 'Patient 2', 'Female', '555-0202', 'patient2@medicore.com', '2026-06-21 00:00:00', 'Active'),
(203, 'Patient 3', 'Male', '555-0203', 'patient3@medicore.com', '2026-06-21 00:00:00', 'Active'),
(204, 'Patient 4', 'Female', '555-0204', 'patient4@medicore.com', '2026-06-21 00:00:00', 'Active'),
(205, 'Patient 5', 'Male', '555-0205', 'patient5@medicore.com', '2026-06-21 00:00:00', 'Active');

INSERT INTO USER_ACCOUNT (user_id, patient_id, username, password_hash, role, status, created_date)
VALUES 
(201, 201, 'Patient1', '$2b$10$snyUAIAGmA9WYniWwzRnre8ReuMwcCl0Wy0j07x.auj6fAdakcsyq', 'Patient', 'Active', '2026-06-21 00:00:00'),
(202, 202, 'Patient2', '$2b$10$snyUAIAGmA9WYniWwzRnre8ReuMwcCl0Wy0j07x.auj6fAdakcsyq', 'Patient', 'Active', '2026-06-21 00:00:00'),
(203, 203, 'Patient3', '$2b$10$snyUAIAGmA9WYniWwzRnre8ReuMwcCl0Wy0j07x.auj6fAdakcsyq', 'Patient', 'Active', '2026-06-21 00:00:00'),
(204, 204, 'Patient4', '$2b$10$snyUAIAGmA9WYniWwzRnre8ReuMwcCl0Wy0j07x.auj6fAdakcsyq', 'Patient', 'Active', '2026-06-21 00:00:00'),
(205, 205, 'Patient5', '$2b$10$snyUAIAGmA9WYniWwzRnre8ReuMwcCl0Wy0j07x.auj6fAdakcsyq', 'Patient', 'Active', '2026-06-21 00:00:00');

-- 6. Insert 10 Dummy Lab Tests
INSERT INTO LAB_TEST (test_id, test_name, description, test_fee, status)
VALUES 
(1, 'CBC (Complete Blood Count)', 'Routine blood test for general health evaluation', 500.00, 'Available'),
(2, 'Blood Sugar (Fasting)', 'Measures blood glucose level after overnight fast', 150.00, 'Available'),
(3, 'Lipid Profile', 'Measures cholesterol and triglycerides in blood', 800.00, 'Available'),
(4, 'Serum Creatinine', 'Measures kidney function', 400.00, 'Available'),
(5, 'SGPT (ALT)', 'Liver function test', 400.00, 'Available'),
(6, 'Chest X-Ray (P/A View)', 'Radiograph of the chest', 600.00, 'Available'),
(7, 'ECG', 'Electrocardiogram for heart function', 400.00, 'Available'),
(8, 'USG Whole Abdomen', 'Ultrasound sonography of whole abdomen', 1200.00, 'Available'),
(9, 'Urine R/E', 'Urine Routine Examination', 200.00, 'Available'),
(10, 'Dengue NS1 Antigen', 'Test for early detection of Dengue virus', 500.00, 'Available');

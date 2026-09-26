const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const prescriptionController = require('../controllers/prescriptionController');
const validate = require('../middleware/validate');
const { createPrescriptionSchema } = require('../validators/prescriptionValidators');

// All routes require authentication
router.use(authMiddleware);

// @route   GET /api/prescriptions/patient/all
// @desc    Get all prescriptions for the logged-in patient
router.get('/patient/all', prescriptionController.getPatientPrescriptions);

// @route   GET /api/prescriptions/prescription/:prescriptionId/pdf
// @desc    Download printable prescription PDF by prescription ID
router.get('/prescription/:prescriptionId/pdf', prescriptionController.downloadPrescriptionPdf);

// @route   GET /api/prescriptions/:appointmentId/pdf
// @desc    Download printable prescription PDF (by prescription ID or appointment ID)
router.get('/:appointmentId/pdf', prescriptionController.downloadPrescriptionPdf);

// @route   GET /api/prescriptions/:appointmentId
// @desc    Get prescription for a specific appointment
router.get('/:appointmentId', prescriptionController.getPrescriptionByAppointmentId);

// @route   POST /api/prescriptions
// @desc    Create a new prescription
router.post('/', validate(createPrescriptionSchema), prescriptionController.createPrescription);

module.exports = router;

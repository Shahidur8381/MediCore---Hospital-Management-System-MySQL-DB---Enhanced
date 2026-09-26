const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const appointmentController = require('../controllers/appointmentController');
const validate = require('../middleware/validate');
const {
  createAppointmentSchema,
  updateAppointmentStatusSchema
} = require('../validators/appointmentValidators');

// All routes require authentication
router.use(authMiddleware);

// @route   GET /api/appointments/stats
router.get('/stats', appointmentController.getStats);

// @route   GET /api/appointments/availability
router.get('/availability', appointmentController.getDoctorAvailability);

// @route   GET /api/appointments
// @desc    Get all appointments (Filtered by role)
router.get('/', appointmentController.getAppointments);

// @route   POST /api/appointments
// @desc    Book a new appointment
router.post('/', validate(createAppointmentSchema), appointmentController.createAppointment);

// @route   PUT /api/appointments/:id/status
// @desc    Update appointment status
router.put('/:id/status', validate(updateAppointmentStatusSchema), appointmentController.updateAppointmentStatus);

module.exports = router;

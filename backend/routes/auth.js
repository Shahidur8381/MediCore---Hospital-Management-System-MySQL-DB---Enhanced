const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  loginSchema,
  registerPatientSchema,
  registerDoctorSchema
} = require('../validators/authValidators');

router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/verify-admin-token', authMiddleware, authController.verifyAdminToken);
router.post('/register-patient', authLimiter, validate(registerPatientSchema), authController.registerPatient);
router.post('/register-doctor', authMiddleware, roleMiddleware('Admin'), validate(registerDoctorSchema), authController.registerDoctor);
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;

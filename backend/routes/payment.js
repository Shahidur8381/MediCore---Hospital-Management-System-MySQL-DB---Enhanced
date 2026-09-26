const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { initiatePaymentSchema, ipnSchema } = require('../validators/paymentValidators');
const { paymentLimiter } = require('../middleware/rateLimiter');

// @route   POST /api/payment/initiate
// @desc    Initiate SSLCommerz payment
// @access  Private (Patient)
router.post(
  '/initiate',
  paymentLimiter,
  authMiddleware,
  validate(initiatePaymentSchema),
  paymentController.initiatePayment
);

// @route   POST /api/payment/ipn
// @desc    IPN webhook from SSLCommerz
// @access  Public (Gateway webhook)
router.post('/ipn', validate(ipnSchema), paymentController.handleIpn);

// SSLCommerz redirects
router.post('/success', paymentController.handleSuccess);
router.post('/fail', paymentController.handleFail);
router.post('/cancel', paymentController.handleCancel);

// Also accept GET for sandbox simulations
router.get('/success', paymentController.handleSuccess);
router.get('/fail', paymentController.handleFail);
router.get('/cancel', paymentController.handleCancel);

// @route   GET /api/payment/status/:tranId
// @desc    Get transaction status & audit record
// @access  Private
router.get('/status/:tranId', authMiddleware, paymentController.getPaymentStatus);

module.exports = router;

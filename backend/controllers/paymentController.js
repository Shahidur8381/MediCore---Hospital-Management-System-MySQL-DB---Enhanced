const { executeQuery, getConnection } = require('../config/db');
const sslcommerzService = require('../services/sslcommerzService');
const { emitAppointmentStatusChange } = require('../socket');

// @route   POST /api/payment/initiate
// @desc    Initiate SSLCommerz payment for an appointment or lab test
// @access  Private (Patient)
exports.initiatePayment = async (req, res) => {
  let connection;
  try {
    if (req.user.role !== 'Patient') {
      return res.status(403).json({ message: 'Only patients can initiate payments' });
    }

    const { itemType, itemId, itemIds } = req.body;
    const patientId = req.user.patientId;

    let amount = 0;
    let appointmentId = null;
    let labRecordId = null;
    let bulkItemIds = null;
    let finalItemType = itemType;
    let targetItemId = itemId ? parseInt(itemId, 10) : null;
    let targetRecordIds = [];
    let validIds = [];

    if (itemType === 'Appointment') {
      appointmentId = parseInt(itemId, 10);
      const aptQuery = `
        SELECT a.appointment_id, a.patient_id, a.doctor_id, d.consultation_fee, a.status
        FROM APPOINTMENT a
        JOIN DOCTOR d ON a.doctor_id = d.doctor_id
        WHERE a.appointment_id = ? AND a.patient_id = ?
      `;
      const aptRes = await executeQuery(aptQuery, [appointmentId, patientId]);

      if (aptRes.rows.length === 0) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      amount = parseFloat(aptRes.rows[0].CONSULTATION_FEE);
    } else if (itemType === 'Lab Test' || itemType === 'Bulk Lab Tests') {
      // Determine record IDs to process
      if (Array.isArray(itemIds) && itemIds.length > 0) {
        targetRecordIds = itemIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id) && id > 0);
      } else if (itemId) {
        const parsed = parseInt(itemId, 10);
        if (!isNaN(parsed) && parsed > 0) {
          targetRecordIds = [parsed];
        }
      }

      if (targetRecordIds.length === 0) {
        return res.status(400).json({ message: 'No valid lab tests specified' });
      }

      const placeholders = targetRecordIds.map(() => '?').join(',');
      const labQuery = `
        SELECT r.record_id, r.patient_id, r.doctor_id, r.waive_commission, r.payment_status, t.test_fee, t.test_name
        FROM LAB_TEST_RECORD r
        JOIN LAB_TEST t ON r.test_id = t.test_id
        WHERE r.record_id IN (${placeholders}) AND r.patient_id = ?
      `;
      const labRes = await executeQuery(labQuery, [...targetRecordIds, patientId]);

      if (labRes.rows.length === 0) {
        return res.status(404).json({ message: 'Selected lab test records not found' });
      }

      const unpaidRecords = labRes.rows.filter(r => r.PAYMENT_STATUS !== 'Paid');
      if (unpaidRecords.length === 0) {
        return res.status(400).json({ message: 'All selected lab tests have already been paid' });
      }

      let totalFee = 0;
      validIds = [];
      for (const rec of unpaidRecords) {
        validIds.push(rec.RECORD_ID);
        const testFee = parseFloat(rec.TEST_FEE);
        const fee = rec.WAIVE_COMMISSION === 'Y' ? Math.ceil(testFee * 0.75) : testFee;
        totalFee += fee;
      }

      amount = totalFee;
      labRecordId = validIds[0];
      targetItemId = validIds[0];

      if (validIds.length > 1 || itemType === 'Bulk Lab Tests') {
        finalItemType = 'Bulk Lab Tests';
        bulkItemIds = JSON.stringify(validIds);
      } else {
        finalItemType = 'Lab Test';
      }
    } else {
      return res.status(400).json({ message: 'Invalid item type' });
    }

    // Get patient details for SSLCommerz customer info
    const patRes = await executeQuery(
      `SELECT name, email, phone, address FROM PATIENT WHERE patient_id = ?`,
      [patientId]
    );
    const pat = patRes.rows[0] || {};

    // Generate unique transaction reference
    const tranId = `MED_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    // Insert initial payment transaction record (Audit Log)
    await executeQuery(
      `INSERT INTO PAYMENT_TRANSACTION 
        (tran_id, patient_id, item_type, item_id, bulk_item_ids, amount, currency, status, appointment_id, lab_record_id)
       VALUES (?, ?, ?, ?, ?, ?, 'BDT', 'PENDING', ?, ?)`,
      [tranId, patientId, finalItemType, targetItemId, bulkItemIds, amount, appointmentId, labRecordId]
    );

    // Call SSLCommerz Gateway Initiation
    const paymentSession = await sslcommerzService.initPayment({
      tranId,
      amount,
      itemType: finalItemType,
      itemId: bulkItemIds ? `${validIds.length} Tests` : targetItemId,
      patientId,
      customerName: pat.NAME,
      customerEmail: pat.EMAIL,
      customerPhone: pat.PHONE,
      customerAddress: pat.ADDRESS
    });

    res.status(200).json({
      status: 'success',
      message: 'Payment session initiated',
      tranId,
      amount,
      gatewayUrl: paymentSession.gatewayUrl,
      simulated: paymentSession.simulated || false
    });
  } catch (err) {
    console.error('Payment initiation error:', err.message);
    res.status(500).json({ message: 'Server error initiating payment' });
  }
};

/**
 * Common internal method to verify and finalize payment transaction
 * Enforces idempotency to prevent duplicate ledger inserts.
 */
async function processPaymentFinalization(tranId, valId, payload = {}) {
  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    // 1. Fetch transaction record
    const txRes = await connection.execute(
      `SELECT * FROM PAYMENT_TRANSACTION WHERE tran_id = ? FOR UPDATE`,
      [tranId]
    );

    if (txRes.rows.length === 0) {
      await connection.rollback();
      return { success: false, reason: 'Transaction not found' };
    }

    const tx = txRes.rows[0];

    // Idempotency: If already VALID or COMPLETED, do not reprocess!
    if (tx.STATUS === 'VALID' || tx.STATUS === 'COMPLETED') {
      await connection.rollback();
      return { success: true, alreadyProcessed: true, transaction: tx };
    }

    // 2. Server-side verification with SSLCommerz
    let verified = false;
    let bankTranId = payload.bank_tran_id || null;
    let cardType = payload.card_type || null;
    let cardIssuer = payload.card_issuer || null;

    if (valId) {
      const valResult = await sslcommerzService.validatePayment({
        valId,
        tranId,
        expectedAmount: tx.AMOUNT
      });

      if (valResult.isValid) {
        verified = true;
        bankTranId = valResult.bankTranId || bankTranId;
        cardType = valResult.cardType || cardType;
        cardIssuer = valResult.cardIssuer || cardIssuer;
      } else {
        console.warn('SSLCommerz server-side validation declined:', valResult.reason);
      }
    } else if (payload.status === 'VALID' || payload.status === 'SUCCESS') {
      // In sandbox/simulation mode if val_id is not passed
      verified = true;
    }

    if (!verified) {
      await connection.execute(
        `UPDATE PAYMENT_TRANSACTION SET status = 'FAILED', ipn_payload = ? WHERE tran_id = ?`,
        [JSON.stringify(payload), tranId]
      );
      await connection.commit();
      return { success: false, reason: 'Payment validation failed' };
    }

    // 3. Mark transaction as VALID
    await connection.execute(
      `UPDATE PAYMENT_TRANSACTION 
       SET status = 'VALID', val_id = ?, bank_tran_id = ?, card_type = ?, card_issuer = ?, ipn_payload = ?
       WHERE tran_id = ?`,
      [valId || 'SANDBOX_VALIDATED', bankTranId, cardType, cardIssuer, JSON.stringify(payload), tranId]
    );

    // 4. Update the related business entity (Appointment or Lab Test / Bulk Lab Tests)
    if (tx.ITEM_TYPE === 'Appointment') {
      // Confirm appointment
      await connection.execute(
        `UPDATE APPOINTMENT SET status = 'Confirmed' WHERE appointment_id = ?`,
        [tx.APPOINTMENT_ID]
      );
    } else if (tx.ITEM_TYPE === 'Lab Test' || tx.ITEM_TYPE === 'Bulk Lab Tests' || tx.BULK_ITEM_IDS) {
      let recordIdsToFinalize = [];
      if (tx.BULK_ITEM_IDS) {
        try {
          recordIdsToFinalize = JSON.parse(tx.BULK_ITEM_IDS);
        } catch {
          recordIdsToFinalize = String(tx.BULK_ITEM_IDS)
            .split(',')
            .map(s => parseInt(s.trim(), 10))
            .filter(Boolean);
        }
      }
      if (!Array.isArray(recordIdsToFinalize) || recordIdsToFinalize.length === 0) {
        if (tx.LAB_RECORD_ID) {
          recordIdsToFinalize = [tx.LAB_RECORD_ID];
        } else if (tx.ITEM_ID) {
          recordIdsToFinalize = [tx.ITEM_ID];
        }
      }

      for (const recId of recordIdsToFinalize) {
        const recResult = await connection.execute(
          `SELECT r.record_id, r.patient_id, r.doctor_id, r.waive_commission, t.test_fee
           FROM LAB_TEST_RECORD r
           JOIN LAB_TEST t ON r.test_id = t.test_id
           WHERE r.record_id = ?`,
          [recId]
        );

        if (recResult.rows.length > 0) {
          const rec = recResult.rows[0];
          const fee = parseFloat(rec.TEST_FEE);
          let doctorAmount = 0;
          let adminAmount = Math.ceil(fee * 0.75);
          let totalAmount = Math.ceil(fee * 0.75);

          if (rec.WAIVE_COMMISSION === 'N') {
            doctorAmount = Math.ceil(fee * 0.25);
            totalAmount = fee;
            adminAmount = fee - doctorAmount;
          }

          await connection.execute(
            `UPDATE LAB_TEST_RECORD SET payment_status = 'Paid', status = 'Awaiting Result' WHERE record_id = ?`,
            [recId]
          );

          // Check if already in ledger to avoid duplicate ledger entry
          const ledgerCheck = await connection.execute(
            `SELECT ledger_id FROM FINANCIAL_LEDGER WHERE transaction_type = 'Lab Test' AND reference_id = ?`,
            [recId]
          );

          if (ledgerCheck.rows.length === 0) {
            await connection.execute(
              `INSERT INTO FINANCIAL_LEDGER (transaction_type, reference_id, patient_id, doctor_id, total_amount, doctor_amount, admin_amount, is_cleared)
               VALUES ('Lab Test', ?, ?, ?, ?, ?, ?, 'N')`,
              [recId, rec.PATIENT_ID, rec.DOCTOR_ID, totalAmount, doctorAmount, adminAmount]
            );
          }
        }
      }
    }

    await connection.commit();
    return { success: true, transaction: tx };
  } catch (err) {
    if (connection) {
      try { await connection.rollback(); } catch (e) {}
    }
    console.error('Error processing payment finalization:', err.message);
    throw err;
  } finally {
    if (connection) {
      try { connection.release(); } catch (e) {}
    }
  }
}

// @route   POST /api/payment/ipn
// @desc    IPN Webhook callback from SSLCommerz
// @access  Public (Webhook)
exports.handleIpn = async (req, res) => {
  const payload = { ...req.query, ...req.body };
  const tranId = payload.tran_id;
  const valId = payload.val_id;

  if (!tranId) {
    return res.status(400).json({ message: 'Missing transaction ID (tran_id)' });
  }

  try {
    const result = await processPaymentFinalization(tranId, valId, payload);
    if (result.success) {
      res.status(200).json({ status: 'success', message: 'IPN processed successfully' });
    } else {
      res.status(400).json({ status: 'error', message: result.reason || 'Verification failed' });
    }
  } catch (err) {
    console.error('IPN processing error:', err.message);
    res.status(500).json({ message: 'Server error processing IPN' });
  }
};

// @route   POST /api/payment/success
// @desc    Success redirect from SSLCommerz
// @access  Public
exports.handleSuccess = async (req, res) => {
  const payload = { ...req.query, ...req.body };
  const tranId = payload.tran_id;
  const valId = payload.val_id;

  const clientUrls = (process.env.CLIENT_URL || 'http://localhost:3000').split(',');
  const clientUrl = clientUrls.find(u => u.includes('3005')) || clientUrls[0];

  try {
    if (tranId) {
      await processPaymentFinalization(tranId, valId, payload);
    }
    res.redirect(`${clientUrl}/payment/success?tran_id=${tranId || ''}`);
  } catch (err) {
    console.error('Success redirect handler error:', err.message);
    res.redirect(`${clientUrl}/payment/failed?error=processing_error`);
  }
};

// @route   POST /api/payment/fail
// @desc    Failure redirect from SSLCommerz
// @access  Public
exports.handleFail = async (req, res) => {
  const payload = { ...req.query, ...req.body };
  const tranId = payload.tran_id;

  if (tranId) {
    try {
      await executeQuery(
        `UPDATE PAYMENT_TRANSACTION SET status = 'FAILED', ipn_payload = ? WHERE tran_id = ?`,
        [JSON.stringify(payload), tranId]
      );
    } catch (e) {}
  }

  const clientUrls = (process.env.CLIENT_URL || 'http://localhost:3000').split(',');
  const clientUrl = clientUrls.find(u => u.includes('3005')) || clientUrls[0];
  res.redirect(`${clientUrl}/payment/failed?tran_id=${tranId || ''}`);
};

// @route   POST /api/payment/cancel
// @desc    Cancel redirect from SSLCommerz
// @access  Public
exports.handleCancel = async (req, res) => {
  const payload = { ...req.query, ...req.body };
  const tranId = payload.tran_id;

  if (tranId) {
    try {
      await executeQuery(
        `UPDATE PAYMENT_TRANSACTION SET status = 'CANCELLED', ipn_payload = ? WHERE tran_id = ?`,
        [JSON.stringify(payload), tranId]
      );
    } catch (e) {}
  }

  const clientUrls = (process.env.CLIENT_URL || 'http://localhost:3000').split(',');
  const clientUrl = clientUrls.find(u => u.includes('3005')) || clientUrls[0];
  res.redirect(`${clientUrl}/payment/cancel?tran_id=${tranId || ''}`);
};

// @route   GET /api/payment/status/:tranId
// @desc    Get payment audit log status
// @access  Private (Patient or Admin)
exports.getPaymentStatus = async (req, res) => {
  try {
    const { tranId } = req.params;
    const result = await executeQuery(
      `SELECT * FROM PAYMENT_TRANSACTION WHERE tran_id = ?`,
      [tranId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const tx = result.rows[0];

    // Authorization: only the patient who made the payment or Admin can view it
    if (req.user.role === 'Patient' && String(req.user.patientId) !== String(tx.PATIENT_ID)) {
      return res.status(403).json({ message: 'Access denied to this transaction' });
    }

    res.json(tx);
  } catch (err) {
    console.error('Error fetching payment status:', err.message);
    res.status(500).json({ message: 'Server error retrieving transaction' });
  }
};

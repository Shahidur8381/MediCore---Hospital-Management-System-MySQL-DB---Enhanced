const { z } = require('zod');

const createPrescriptionSchema = {
  body: z.object({
    Appointment_ID: z.coerce.number({ required_error: 'Appointment ID is required' }).int().positive(),
    Patient_ID: z.coerce.number({ required_error: 'Patient ID is required' }).int().positive(),
    Diagnosis: z.string({ required_error: 'Diagnosis is required' }).min(2, 'Diagnosis must be at least 2 characters').max(255).trim(),
    Medicines: z.string().optional().nullable(),
    Notes: z.string().optional().nullable()
  })
};

module.exports = {
  createPrescriptionSchema
};

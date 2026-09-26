const { z } = require('zod');

const createAppointmentSchema = {
  body: z.object({
    Doctor_ID: z.coerce.number({ required_error: 'Doctor ID is required' }).int().positive(),
    Appointment_Date: z.string({ required_error: 'Appointment Date is required' })
      .regex(/^\d{4}-\d{2}-\d{2}(T.*)?$/, 'Date must be formatted as YYYY-MM-DD')
  })
};

const updateAppointmentStatusSchema = {
  params: z.object({
    id: z.coerce.number({ required_error: 'Appointment ID is required' }).int().positive()
  }),
  body: z.object({
    status: z.enum(['Pending', 'Confirmed', 'Completed', 'Cancelled', 'Waiting'], {
      required_error: 'Status is required'
    })
  })
};

module.exports = {
  createAppointmentSchema,
  updateAppointmentStatusSchema
};

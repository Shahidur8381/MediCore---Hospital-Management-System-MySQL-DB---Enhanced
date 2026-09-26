const { z } = require('zod');

const initiatePaymentSchema = {
  body: z.object({
    itemType: z.enum(['Appointment', 'Lab Test', 'Bulk Lab Tests'], {
      required_error: 'Item type must be "Appointment", "Lab Test", or "Bulk Lab Tests"'
    }),
    itemId: z.coerce.number().int().positive().optional(),
    itemIds: z.array(z.coerce.number().int().positive()).optional()
  }).refine((data) => data.itemId || (data.itemIds && data.itemIds.length > 0), {
    message: 'Either itemId or non-empty itemIds must be provided',
    path: ['itemId']
  })
};

const ipnSchema = {
  body: z.object({
    tran_id: z.string({ required_error: 'Transaction ID (tran_id) is required' }),
    val_id: z.string().optional(),
    amount: z.coerce.number().optional(),
    card_type: z.string().optional(),
    bank_tran_id: z.string().optional(),
    status: z.string().optional()
  }).passthrough()
};

module.exports = {
  initiatePaymentSchema,
  ipnSchema
};

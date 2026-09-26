const { z } = require('zod');

const orderLabTestSchema = {
  body: z.object({
    Patient_ID: z.coerce.number({ required_error: 'Patient ID is required' }).int().positive(),
    Test_ID: z.coerce.number({ required_error: 'Test ID is required' }).int().positive(),
    waiveCommission: z.boolean().optional().default(false)
  })
};

const payLabTestSchema = {
  params: z.object({
    id: z.coerce.number({ required_error: 'Record ID is required' }).int().positive()
  })
};

const completeLabTestSchema = {
  params: z.object({
    id: z.coerce.number({ required_error: 'Record ID is required' }).int().positive()
  }),
  body: z.object({
    Result_Details: z.string({ required_error: 'Result details are required' }).min(2, 'Result details cannot be empty').trim()
  })
};

module.exports = {
  orderLabTestSchema,
  payLabTestSchema,
  completeLabTestSchema
};

const { z } = require('zod');

const loginSchema = {
  body: z.object({
    username: z.string({ required_error: 'Username is required' }).min(1, 'Username cannot be empty').trim(),
    password: z.string({ required_error: 'Password is required' }).min(1, 'Password cannot be empty')
  })
};

const registerPatientSchema = {
  body: z.object({
    username: z.string({ required_error: 'Username is required' })
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username cannot exceed 50 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain alphanumeric characters and underscores')
      .trim(),
    password: z.string({ required_error: 'Password is required' })
      .min(6, 'Password must be at least 6 characters long'),
    name: z.string({ required_error: 'Full name is required' })
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters')
      .trim(),
    gender: z.enum(['Male', 'Female', 'Other']).optional(),
    dob: z.string().optional().nullable().transform(v => (v === '' || v === undefined) ? null : v)
      .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format').nullable().optional()),
    bloodGroup: z.string().max(5).optional().nullable().transform(v => v === '' ? null : v),
    phone: z.string({ required_error: 'Phone number is required' })
      .min(5, 'Phone number must be at least 5 digits')
      .max(20, 'Phone number cannot exceed 20 characters')
      .trim(),
    email: z.string().optional().nullable().transform(v => v === '' ? null : v)
      .pipe(z.string().email('Invalid email address').nullable().optional()),
    address: z.string().max(255).optional().nullable().transform(v => v === '' ? null : v),
    emergencyContact: z.string().max(20).optional().nullable().transform(v => v === '' ? null : v)
  })
};

const registerDoctorSchema = {
  body: z.object({
    username: z.string({ required_error: 'Username is required' })
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username cannot exceed 50 characters')
      .trim(),
    password: z.string({ required_error: 'Password is required' })
      .min(6, 'Password must be at least 6 characters long'),
    departmentId: z.coerce.number().int().positive().optional().nullable(),
    name: z.string({ required_error: 'Name is required' }).min(2).max(100).trim(),
    gender: z.enum(['Male', 'Female', 'Other']).optional(),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'DOB must be YYYY-MM-DD').optional().nullable(),
    specialization: z.string().max(100).optional().nullable(),
    qualification: z.string().max(100).optional().nullable(),
    phone: z.string({ required_error: 'Phone is required' }).min(5).max(20).trim(),
    email: z.string({ required_error: 'Email is required' }).email('Invalid email address').trim(),
    fee: z.coerce.number({ required_error: 'Consultation fee is required' }).positive('Fee must be positive')
  })
};

module.exports = {
  loginSchema,
  registerPatientSchema,
  registerDoctorSchema
};

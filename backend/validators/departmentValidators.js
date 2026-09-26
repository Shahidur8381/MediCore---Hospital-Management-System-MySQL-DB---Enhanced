const { z } = require('zod');

const createDepartmentSchema = {
  body: z.object({
    name: z.string({ required_error: 'Department name is required' }).min(2, 'Name must be at least 2 characters').max(100).trim(),
    head: z.string().max(100).optional().nullable()
  })
};

const updateDepartmentSchema = {
  params: z.object({
    id: z.coerce.number().int().positive()
  }),
  body: z.object({
    name: z.string({ required_error: 'Department name is required' }).min(2).max(100).trim(),
    head: z.string().max(100).optional().nullable()
  })
};

const departmentIdParamSchema = {
  params: z.object({
    id: z.coerce.number().int().positive()
  })
};

module.exports = {
  createDepartmentSchema,
  updateDepartmentSchema,
  departmentIdParamSchema
};

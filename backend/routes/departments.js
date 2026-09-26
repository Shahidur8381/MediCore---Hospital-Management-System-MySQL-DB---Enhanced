const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const validate = require('../middleware/validate');
const {
  createDepartmentSchema,
  updateDepartmentSchema,
  departmentIdParamSchema
} = require('../validators/departmentValidators');

router.get('/', departmentController.getDepartments);
router.post('/', authMiddleware, roleMiddleware('Admin'), validate(createDepartmentSchema), departmentController.createDepartment);
router.put('/:id', authMiddleware, roleMiddleware('Admin'), validate(updateDepartmentSchema), departmentController.updateDepartment);
router.delete('/:id', authMiddleware, roleMiddleware('Admin'), validate(departmentIdParamSchema), departmentController.deleteDepartment);

module.exports = router;

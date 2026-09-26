const { executeQuery } = require('../config/db');

// @route   GET /api/departments
// @desc    Get all departments
// @access  Public or Private
exports.getDepartments = async (req, res) => {
    try {
        const result = await executeQuery('SELECT * FROM DEPARTMENT ORDER BY department_name');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching departments:', err.message);
        res.status(500).json({ message: 'Server error retrieving departments' });
    }
};

// @route   POST /api/departments
// @desc    Create a department
// @access  Private (Admin)
exports.createDepartment = async (req, res) => {
    const { name, head } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Department name is required' });
    }

    try {
        await executeQuery(
            `INSERT INTO DEPARTMENT (department_name, department_head) VALUES (?, ?)`,
            [name.trim(), head ? head.trim() : null]
        );
        res.status(201).json({ message: 'Department created successfully' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Department with this name already exists' });
        }
        console.error('Error creating department:', err.message);
        res.status(500).json({ message: 'Server error creating department' });
    }
};

// @route   PUT /api/departments/:id
// @desc    Update a department
// @access  Private (Admin)
exports.updateDepartment = async (req, res) => {
    const { name, head } = req.body;
    const { id } = req.params;

    if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Department name is required' });
    }

    try {
        const result = await executeQuery(
            `UPDATE DEPARTMENT SET department_name = ?, department_head = ? WHERE department_id = ?`,
            [name.trim(), head ? head.trim() : null, id]
        );
        
        if (result.rowsAffected === 0) {
            return res.status(404).json({ message: 'Department not found' });
        }
        res.json({ message: 'Department updated successfully' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Department with this name already exists' });
        }
        console.error('Error updating department:', err.message);
        res.status(500).json({ message: 'Server error updating department' });
    }
};

// @route   DELETE /api/departments/:id
// @desc    Delete a department
// @access  Private (Admin)
exports.deleteDepartment = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await executeQuery('DELETE FROM DEPARTMENT WHERE department_id = ?', [id]);
        if (result.rowsAffected === 0) {
            return res.status(404).json({ message: 'Department not found' });
        }
        res.json({ message: 'Department deleted successfully' });
    } catch (err) {
        console.error('Error deleting department:', err.message);
        res.status(500).json({ message: 'Server error deleting department' });
    }
};

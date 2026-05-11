const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/auth');

// GET all tasks (Dashboard feature) - Members see their tasks, Admins see all
router.get('/', verifyToken, async (req, res) => {
    try {
        let query = 'SELECT * FROM tasks';
        let params = [];
        
        if (req.user.role === 'Member') {
            query += ' WHERE assigned_to = ?';
            params.push(req.user.id);
        }
        
        const [tasks] = await db.execute(query, params);
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST a new task - ONLY Admins can assign tasks
router.post('/', [verifyToken, isAdmin], async (req, res) => {
    const { project_id, title, description, assigned_to, due_date } = req.body;
    
    // Basic Validation
    if(!project_id || !title || !due_date) {
        return res.status(400).json({ error: "Project ID, Title, and Due Date are required." });
    }

    try {
        const query = `INSERT INTO tasks (project_id, title, description, assigned_to, due_date) VALUES (?, ?, ?, ?, ?)`;
        const [result] = await db.execute(query, [project_id, title, description, assigned_to, due_date]);
        res.status(201).json({ message: "Task created successfully", taskId: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
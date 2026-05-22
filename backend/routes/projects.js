// routes/projects.js ka top section
const express = require('express');
const router = express.Router();
// ✅ FIX: Removed one extra '../'
const db = require('../config/db'); 
const { verifyToken } = require('../middleware/auth');

// Get all projects
router.get('/', verifyToken, async (req, res) => {
    try {
        const [projects] = await db.execute('SELECT * FROM projects');
        res.json(projects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new project
router.post('/', verifyToken, async (req, res) => {
    const { name, description } = req.body;
    
    if (!name) return res.status(400).json({ error: "Project name is required" });

    try {
        const query = 'INSERT INTO projects (name, description, created_by) VALUES (?, ?, ?)';
        const [result] = await db.execute(query, [name, description, req.user.id]);
        res.status(201).json({ message: "Project created", projectId: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
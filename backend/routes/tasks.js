const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
    try {
        // Sirf wahi tasks fetch karo jo current user ko assigned hain
        const query = 'SELECT * FROM tasks WHERE assigned_to = ?';
        const [tasks] = await db.execute(query, [req.user.id]);
        res.json(tasks);
    } catch (err) {
        console.error("Database Error:", err.message);
        res.status(500).json({ error: "Database error occurred" });
    }
});
// routes/tasks.js - Updated POST route
router.post('/', verifyToken, async (req, res) => {
    const { title, description, project_id, status } = req.body; // Frontend se project_id aayega
    
    if(!title) return res.status(400).json({ error: "Title is required" });

    try {
        const query = 'INSERT INTO tasks (title, description, assigned_to, status, project_id) VALUES (?, ?, ?, ?, ?)';
        const [result] = await db.execute(query, [
            title, 
            description || '', 
            req.user.id, 
            'Pending',
            project_id || null // Agar select nahi kiya toh null jayega
        ]);
        
        res.status(201).json({
            id: result.insertId,
            title,
            description,
            status: 'Pending',
            project_id
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
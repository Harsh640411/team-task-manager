const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// 1. 📝 CREATE TASK - FIX: Added 'username' to DB insert
router.post('/', verifyToken, async (req, res) => {
    const { title, description, project_id, project_name, status } = req.body;
    const userId = req.user.id; // token se mil raha hai
    const userEmail = req.user.username; // token se email mil raha hai

    let safeProjectId = parseInt(project_id) || 1;

    try {
        // Title format padding
        const modifiedDynamicTitle = `[${project_name || 'General'}] ${title || 'Untitled Task'} (By: ${userEmail.split('@')[0]})`;

        // ✅ FIX: Insert username (email) along with task
        const [result] = await db.execute(
            'INSERT INTO tasks (title, description, project_id, status, username) VALUES (?, ?, ?, ?, ?)',
            [modifiedDynamicTitle, description || '', safeProjectId, status || 'In Progress', userEmail]
        );
        
        return res.status(201).json({ id: result.insertId, message: "Task registered successfully! 🚀" });
    } catch (err) {
        console.error("Task Creation Error:", err);
        return res.status(500).json({ error: err.message });
    }
});

// GET /api/tasks (Backend tasks.js mein yeh update karo)
router.get('/', verifyToken, async (req, res) => {
    const userEmail = req.user.username;
    const userRole = req.user.role;

    try {
        let query = 'SELECT * FROM tasks ORDER BY id DESC';
        let params = [];

        // Admin ke liye sab dikhao, baaki sirf apne tasks
        if (userRole !== 'admin' && userRole !== 'Admin') {
            query = 'SELECT * FROM tasks WHERE username = ? ORDER BY id DESC';
            params = [userEmail];
        }

        const [tasks] = await db.execute(query, params);
        return res.json(tasks || []); // Empty array return karo agar kuch na mile
    } catch (err) {
        console.error("GET Tasks Error:", err);
        return res.status(500).json({ error: "Server Error" });
    }
});

// 3. 🎯 UPDATE TASK STATUS
router.put('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await db.execute('UPDATE tasks SET status = ? WHERE id = ?', [status, id]);
        return res.json({ message: "Task status updated successfully!" });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
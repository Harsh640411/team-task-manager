const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// CREATE TASK
router.post('/', verifyToken, async (req, res) => {
    const { title, description, project_id, project_name, status } = req.body;
    const userEmail = req.user.username || 'unknown'; // Safety fallback

    let safeProjectId = parseInt(project_id) || 1;

    try {
        const modifiedDynamicTitle = `[${project_name || 'General'}] ${title || 'Untitled Task'} (By: ${userEmail.split('@')[0]})`;

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

// GET TASKS
router.get('/', verifyToken, async (req, res) => {
    const userEmail = req.user.username;
    const userRole = req.user.role;

    // ✅ SAFETY CHECK: Agar token mein username nahi hai, toh crash mat ho
    if (!userEmail) {
        return res.status(401).json({ error: "Session expired or invalid. Please re-login." });
    }

    try {
        if (userRole === 'admin' || userRole === 'Admin') {
            const [allTasks] = await db.execute('SELECT * FROM tasks ORDER BY id DESC');
            return res.json(allTasks);
        } else {
            const [tasks] = await db.execute(
                'SELECT * FROM tasks WHERE username = ? ORDER BY id DESC', 
                [userEmail]
            );
            return res.json(tasks || []);
        }
    } catch (err) {
        console.error("GET Tasks Error:", err);
        return res.status(500).json({ error: err.message });
    }
});

// UPDATE TASK
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
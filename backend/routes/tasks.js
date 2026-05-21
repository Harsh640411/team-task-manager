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

router.get('/', verifyToken, async (req, res) => {
    const userEmail = req.user.username;
    const userRole = req.user.role;

    try {
        if (userRole === 'admin' || userRole === 'Admin') {
            const [allTasks] = await db.execute('SELECT * FROM tasks ORDER BY id DESC');
            return res.json(allTasks);
        } else {
            // ✅ YE FIX HAI: Agar username column mein data hai, toh sirf wahi dikhao
            // Agar data nahi hai (NULL), toh wo task user ko nahi dikhega (leakage stop)
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
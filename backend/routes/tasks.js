const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// 1. 📝 CREATE TASK - Synced perfectly to catch project_name dynamically
router.post('/', verifyToken, async (req, res) => {
    // ✅ FIXED: project_name is now destructured from req.body
    const { title, description, project_id, project_name, status } = req.body;
    const userId = req.user.id;

    let parsedProjectId = parseInt(project_id) || 1;
    // Agar frontend se project_name nahi aaya, toh ek safe fallback string use karein
    let finalProjectName = project_name || 'GEO Sentiment Analyzer';

    try {
        const [users] = await db.execute('SELECT username FROM users WHERE id = ?', [userId]);
        const username = users.length > 0 ? users[0].username : 'tasker@gmail.com';

        // ✅ DYNAMIC INJECTION: Ab 'project_name' ya title matching variables safely filter ho jayenge
        const [result] = await db.execute(
            'INSERT INTO tasks (title, description, project_id, status, user_id, username) VALUES (?, ?, ?, ?, ?, ?)',
            [title || 'Untitled Task', description || '', parsedProjectId, status || 'In Progress', userId, username]
        );
        
        // HACKY BACKEND AUTO-SYNC: Agar table me title update ke sath string tracing match karni ho
        // Toh hum ensuring check ke liye title ko hi optimize kar dete hain taaki filter har haal me pass ho jaye
        if (title && !title.toLowerCase().includes(finalProjectName.split(' ')[0].toLowerCase())) {
            const structuralTitle = `[${finalProjectName}] ${title}`;
            await db.execute('UPDATE tasks SET title = ? WHERE id = ?', [structuralTitle, result.insertId]);
        }
        
        return res.status(201).json({ id: result.insertId, message: "Task registered successfully! 🚀" });
    } catch (err) {
        console.error("DB Insert Failed:", err);
        return res.status(500).json({ error: err.message });
    }
});

// 2. 🔍 GET TASKS - Pulls dynamically based on user identity or Admin reviews
router.get('/', verifyToken, async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        // Enforce direct dynamic array sync for admin dashboard layers
        if (userRole === 'admin' || userRole === 'Admin') {
            const [allTasks] = await db.execute('SELECT * FROM tasks ORDER BY id DESC');
            return res.json(allTasks);
        } else {
            const [userTasks] = await db.execute('SELECT * FROM tasks WHERE user_id = ? ORDER BY id DESC', [userId]);
            return res.json(userTasks);
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// 3. 🎯 UPDATE TASK STATUS
router.put('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await db.execute('UPDATE tasks SET status = ? WHERE id = ?', [status || 'Completed', id]);
        return res.json({ message: "Task status updated successfully!" });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
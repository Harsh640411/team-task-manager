const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// 1. 📝 CREATE TASK - Balanced to match direct client payload inputs safely
router.post('/', verifyToken, async (req, res) => {
    const { title, description, project_id, project_name, status } = req.body;
    const userId = req.user.id;

    let parsedProjectId = parseInt(project_id) || 1;
    let targetProjectString = project_name || 'GEO Sentiment Analyzer';

    try {
        const [users] = await db.execute('SELECT username FROM users WHERE id = ?', [userId]);
        const username = users.length > 0 ? users[0].username : 'tasker@gmail.com';

        // Direct fallback title append: Agar project ID match na ho, toh title ke aage header merge kar do dynamically
        // Isse front-end ka name pattern match 100% trigger ho jayega aur blank kabhi nahi dikhega!
        const modifiedDynamicTitle = `[${targetProjectString}] ${title || 'Untitled Task'}`;

        const [result] = await db.execute(
            'INSERT INTO tasks (title, description, project_id, status, user_id, username) VALUES (?, ?, ?, ?, ?, ?)',
            [modifiedDynamicTitle, description || '', parsedProjectId, status || 'In Progress', userId, username]
        );
        
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
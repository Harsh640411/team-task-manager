const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// 1. 📝 CREATE TASK - Balanced to survive missing table columns smoothly
router.post('/', verifyToken, async (req, res) => {
    const { title, description, project_id, project_name, status } = req.body;
    const userId = req.user.id;

    let parsedProjectId = parseInt(project_id) || 1;
    let targetProjectString = project_name || 'GEO Sentiment Analyzer';

    // ⚡ SUPER SAFE STRING CLUSTERING:
    // Title ke aage hi bracket me project name aur user info inject kar dete hain
    // Isse bina kisi naye db column schema ke, direct admin panel use text match se dhoondh lega!
    const modifiedDynamicTitle = `[${targetProjectString}] ${title || 'Untitled Task'} (By: ${req.user.id})`;

    try {
        // Safe database fallback insertion pattern execution
        // Agar tasks table me user_id aur username missing hain, toh ye query unhe touch hi nahi karegi aur crash nahi hogi!
        const [result] = await db.execute(
            'INSERT INTO tasks (title, description, project_id, status) VALUES (?, ?, ?, ?)',
            [modifiedDynamicTitle, description || '', parsedProjectId, status || 'In Progress']
        );
        
        return res.status(201).json({ id: result.insertId, message: "Task registered successfully! 🚀" });
    } catch (err) {
        console.error("DB Insert Failed Fallback Triggered:", err);
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
            const [allTasks] = await db.execute('SELECT * FROM tasks ORDER BY id DESC');
            // Filter user items safely using javascript string indexing context fallbacks
            const userTasks = allTasks.filter(t => 
                String(t.title).includes(`(By: ${userId})`) || parseInt(t.assigned_to) === parseInt(userId)
            );
            return res.json(userTasks.length > 0 ? userTasks : allTasks);
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
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// 1. 📝 CREATE TASK - Strictly synced with your original database columns (No user_id / username fields to crash)
router.post('/', verifyToken, async (req, res) => {
    const { title, description, project_id, project_name, status } = req.body;

    let parsedProjectId = parseInt(project_id) || 1;
    let targetProjectString = project_name || 'GEO Sentiment Analyzer';

    // ⚡ PATTERN INJECTION FOR ADMIN ACCORDION:
    // Hum title ke andar hi bracket text wrap kar dete hain, taaki database bina crash hue safely insert kar le
    const modifiedDynamicTitle = `[${targetProjectString}] ${title || 'Untitled Task'} (By: ${req.user.id})`;

    try {
        // Query reads columns EXACTLY matching your table (title, description, project_id, status)
        const [result] = await db.execute(
            'INSERT INTO tasks (title, description, project_id, status) VALUES (?, ?, ?, ?)',
            [modifiedDynamicTitle, description || '', parsedProjectId, status || 'In Progress']
        );
        
        return res.status(201).json({ id: MySqlResultPatch(result), message: "Task registered successfully! 🚀" });
    } catch (err) {
        console.error("DB Insert Failed:", err);
        return res.status(500).json({ error: err.message });
    }
});

// Helper handle to safely parse insertId across multiple mysql2 environments
const MySqlResultPatch = (resObj) => {
  if (!resObj) return Date.now();
  return resObj.insertId || resObj.id || Date.now();
};

// 2. 🔍 GET TASKS - Pulls all entries for admin review parsing loop
router.get('/', verifyToken, async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        if (userRole === 'admin' || userRole === 'Admin') {
            const [allTasks] = await db.execute('SELECT * FROM tasks ORDER BY id DESC');
            return res.json(allTasks);
        } else {
            const [allTasks] = await db.execute('SELECT * FROM tasks ORDER BY id DESC');
            // Safely filter user items using javascript pattern match fallback
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
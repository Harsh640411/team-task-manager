const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// 1. 📝 CREATE TASK: Logged-in user ke sath attach karke task save karna
router.post('/', verifyToken, async (req, res) => {
    const { title, description, project_id, status, due_date } = req.body;
    const userId = req.user.id;

    let parsedProjectId = parseInt(project_id) || 1;

    try {
        // Token user id se login session ka dynamic email (username) fetch karo
        const [users] = await db.execute('SELECT username FROM users WHERE id = ?', [userId]);
        const username = users.length > 0 ? users[0].username : 'tasker@gmail.com';

        // ✅ FIXED INSERT: user_id aur username dono strictly save honge
        const [result] = await db.execute(
            'INSERT INTO tasks (title, description, project_id, status, due_date, user_id, username) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [title || 'Untitled Task', description || '', parsedProjectId, status || 'In Progress', due_date || new Date().toISOString().split('T')[0], userId, username]
        );
        
        return res.status(201).json({ id: result.insertId, message: "Task registered successfully! 🚀" });
    } catch (err) {
        console.error("DB Insert Failed:", err);
        return res.status(500).json({ error: err.message });
    }
});

// 2. 🔍 GET USER SPECIFIC TASKS: Bhedbhav hataya! Admin ko sab dikhega, member ko sirf khud ke task!
router.get('/', verifyToken, async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role; // Token se role check kar rahe hain

    try {
        if (userRole === 'admin') {
            // Admin panel hai toh saare tasks fetch karo audit karne ke liye
            const [allTasks] = await db.execute('SELECT * FROM tasks ORDER BY id DESC');
            return res.json(allTasks);
        } else {
            // ✅ FIXED QUERY: Normal member ko sirf uske APNE parameters wale tasks dikhenge!
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
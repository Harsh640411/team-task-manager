const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
    try {
        const [tasks] = await db.execute('SELECT * FROM tasks WHERE assigned_to = ? OR created_by = ?', [req.user.id, req.user.id]);
        res.json(tasks);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', verifyToken, async (req, res) => {
    const { title, description } = req.body;
    if(!title) return res.status(400).json({ error: "Title is required" });
    try {
        const query = `INSERT INTO tasks (title, description, assigned_to, status) VALUES (?, ?, ?, ?)`;
        const [result] = await db.execute(query, [title, description || '', req.user.id, 'Pending']);
        res.status(201).json({ id: result.insertId, title, description, status: 'Pending' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
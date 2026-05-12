const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// SIGNUP
router.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.execute('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', [username, hashedPassword, 'Member']);
        res.status(201).json({ message: "User registered" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// LOGIN
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [users] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) return res.status(401).json({ error: "Invalid credentials" });
        const isMatch = await bcrypt.compare(password, users[0].password_hash);
        if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

        const token = jwt.sign({ id: users[0].id, role: users[0].role }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, username: users[0].username });
    } catch (err) { res.status(500).json({ error: "Server error" }); }
});

// ✅ GET /me (This was missing!)
router.get('/me', verifyToken, async (req, res) => {
    try {
        const [users] = await db.execute('SELECT id, username, role FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) return res.status(404).json({ error: "Not found" });
        res.json(users[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
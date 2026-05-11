const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// SIGNUP (For Members)
router.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)';
        
        await db.execute(query, [username, hashedPassword, 'Member']);
        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: "Username already exists" });
        }
        res.status(500).json({ error: err.message });
    }
});

// LOGIN (For Admin & Members)
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const query = 'SELECT * FROM users WHERE username = ?';
        const [users] = await db.execute(query, [username]);

        if (users.length === 0) {
            return res.status(401).json({ error: "Invalid username or password" });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ error: "Invalid username or password" });
        }

        // Generate JWT Token
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        res.json({ message: "Login successful", token, role: user.role, username: user.username });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
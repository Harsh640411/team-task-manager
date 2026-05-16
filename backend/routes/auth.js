const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// SIGNUP - Restricted to ONLY ONE ADMIN permanent check
router.post('/signup', async (req, res) => {
    // Frontend se role bhi catch kar rahe hain (admin ya tasker)
    const { username, password, role } = req.body; 
    
    // Agar frontend se role nahi aaya, toh default 'tasker' set hoga
    const finalRole = role ? role.toLowerCase() : 'tasker'; 

    try {
        // 🔒 CRITICAL CHECK: Agar user Admin banna chahta hai
        if (finalRole === 'admin') {
            const [existingAdmins] = await db.execute("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
            
            // Agar pehle se koi admin database mein hai (count > 0)
            if (existingAdmins[0].count > 0) {
                return res.status(400).json({ 
                    error: "Admin already exists! Multiple admins are not allowed. ❌" 
                });
            }
        }

        // Agar check pass ho gaya (ya user tasker hai), toh password hash karo
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Database mein finalRole save kar rahe hain ('admin' ya 'tasker')
        await db.execute('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', [username, hashedPassword, finalRole]);
        
        res.status(201).json({ message: "User registered successfully" });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
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

// GET /me
router.get('/me', verifyToken, async (req, res) => {
    try {
        const [users] = await db.execute('SELECT id, username, role FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) return res.status(404).json({ error: "Not found" });
        res.json(users[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
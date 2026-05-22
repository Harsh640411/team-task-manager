const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// SIGNUP - Fixed Data Truncated Role issue smoothly
router.post('/signup', async (req, res) => {
    const { username, password, role } = req.body; 
    
    let frontendRole = role ? role.toLowerCase() : 'tasker';
    let finalRole = 'Member'; 

    if (frontendRole === 'admin') {
        finalRole = 'admin';
    } else {
        finalRole = 'Member';
    }

    try {
        // 1. 🔒 STRICT ADMIN CHECK
        if (finalRole === 'admin') {
            const [existingAdmins] = await db.execute("SELECT id, username FROM users WHERE role = 'admin'");
            if (existingAdmins.length > 0 && existingAdmins[0].username !== username) {
                return res.status(400).json({ 
                    error: "Admin already exists! Multiple admins are not allowed. ❌" 
                });
            }
        }

        // 2. 🔄 CHECK DUPLICATE EMAIL
        const [existingUser] = await db.execute("SELECT id, role FROM users WHERE username = ?", [username]);

        if (existingUser.length > 0) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await db.execute('UPDATE users SET password_hash = ?, role = ? WHERE username = ?', [hashedPassword, finalRole, username]);
            return res.status(200).json({ message: `Account updated successfully to ${frontendRole}! 🚀` });
        }

        // 3. ✨ FRESH REGISTRATION
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.execute('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', [username, hashedPassword, finalRole]);
        
        res.status(201).json({ message: "User registered successfully" });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// LOGIN ROUTE IN routes/auth.js
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [users] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) return res.status(401).json({ error: "Invalid credentials" });
        const isMatch = await bcrypt.compare(password, users[0].password_hash);
        if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

        // ✅ FIX: Token ke andar 'username' add kar diya
        const token = jwt.sign(
            { id: users[0].id, role: users[0].role, username: users[0].username }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );
        res.json({ token, username: users[0].username });
    } catch (err) { res.status(500).json({ error: "Server error" }); }
});

// 1. 📝 TASKER ACTION: Apply for a new leave request (Fixed Strict Table Schema Sync)
router.post('/leaves/apply', verifyToken, async (req, res) => {
    const { fromDate, toDate, reason } = req.body;
    const userId = req.user.id; 

    try {
        // Token user_id se exact log-in session email track kar rahe hain
        const [users] = await db.execute('SELECT username FROM users WHERE id = ?', [userId]);
        if (users.length === 0) return res.status(404).json({ error: "User identity not found" });
        
        const actualUsername = users[0].username; // This captures praphool@gmail.com dynamically

        // ✅ MATCHEED TO YOUR EXACT TABLE FIELDS: No extra columns to crash the insertion
        await db.execute(
            'INSERT INTO leaves (username, fromDate, toDate, reason, status) VALUES (?, ?, ?, ?, ?)',
            [actualUsername, fromDate, toDate, reason, 'Pending']
        );
        res.status(201).json({ message: "Leave applied successfully under your active email session! 🚀" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. 👤 TASKER ACTION: Fetch only this specific logged-in user's leaves
router.get('/leaves/my-leaves', verifyToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const [users] = await db.execute('SELECT username FROM users WHERE id = ?', [userId]);
        if (users.length === 0) return res.status(404).json({ error: "User not found" });

        const [myLeaves] = await db.execute(
            'SELECT * FROM leaves WHERE username = ? ORDER BY id DESC',
            [users[0].username]
        );
        res.json(myLeaves);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 👑 ADMIN ACTION: Fetch all leaves across the system (Required for Admin Tab)
router.get('/leaves', verifyToken, async (req, res) => {
    try {
        const [leaves] = await db.execute('SELECT * FROM leaves ORDER BY id DESC');
        res.json(leaves);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 👑 ADMIN ACTION: Approve or Reject a Leave request
router.put('/leaves/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; 
    try {
        await db.execute('UPDATE leaves SET status = ? WHERE id = ?', [status, id]);
        res.json({ message: `Leave status updated to ${status}` });
    } catch (err) { res.status(500).json({ error: err.message }); }
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
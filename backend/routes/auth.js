const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// SIGNUP - Fixed Data Truncated Role issue smoothly
router.post('/signup', async (req, res) => {
    const { username, password, role } = req.body; 
    
    // ✅ Handle formatting carefully
    let frontendRole = role ? role.toLowerCase() : 'tasker';
    let finalRole = 'Member'; // MySQL ke liye default definition

    // Agar frontend se 'admin' select kiya hai toh 'admin' rahega
    if (frontendRole === 'admin') {
        finalRole = 'admin';
    } else {
        // Agar frontend se 'tasker' aaya hai, toh use database ke ENUM string 'Member' pe map kar do
        finalRole = 'Member';
    }

    try {
        // 1. 🔒 STRICT ADMIN CHECK: Agar user Admin banna chahta hai
        if (finalRole === 'admin') {
            const [existingAdmins] = await db.execute("SELECT id, username FROM users WHERE role = 'admin'");
            
            // Agar koi doosra email pehle se admin hai, toh block karo
            if (existingAdmins.length > 0 && existingAdmins[0].username !== username) {
                return res.status(400).json({ 
                    error: "Admin already exists! Multiple admins are not allowed. ❌" 
                });
            }
        }

        // 2. 🔄 CHECK DUPLICATE EMAIL: Kya ye email pehle se database mein hai?
        const [existingUser] = await db.execute("SELECT id, role FROM users WHERE username = ?", [username]);

        if (existingUser.length > 0) {
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Record update call
            await db.execute('UPDATE users SET password_hash = ?, role = ? WHERE username = ?', [hashedPassword, finalRole, username]);
            return res.status(200).json({ message: `Account updated successfully to ${frontendRole}! 🚀` });
        }

        // 3. ✨ FRESH REGISTRATION: Naye user ke liye query execution
        const hashedPassword = await bcrypt.hash(password, 10);
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

// 1. 📝 TASKER ACTION: Apply for a new leave request
router.post('/leaves/apply', verifyToken, async (req, res) => {
    const { fromDate, toDate, reason } = req.body;
    const username = req.user.username; // token verification se username nikal jayega

    try {
        // Status automatically default 'Pending' set hoga database insert ke waqt
        await db.execute(
            'INSERT INTO leaves (username, fromDate, toDate, reason, status) VALUES (?, ?, ?, ?, ?)',
            [username, fromDate, toDate, reason, 'Pending']
        );
        res.status(201).json({ message: "Leave applied successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. 👤 TASKER ACTION: Fetch only this specific logged-in user's leaves
router.get('/leaves/my-leaves', verifyToken, async (req, res) => {
    const username = req.user.username;
    try {
        const [myLeaves] = await db.execute(
            'SELECT * FROM leaves WHERE username = ? ORDER BY id DESC',
            [username]
        );
        res.json(myLeaves);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
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
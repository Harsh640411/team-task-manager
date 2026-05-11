const jwt = require('jsonwebtoken');

// Verify standard logged-in user
exports.verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: "No token provided." });

    jwt.verify(token.split(' ')[1], process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: "Unauthorized!" });
        req.user = decoded; // Contains id and role
        next();
    });
};

// Verify user is an Admin
exports.isAdmin = (req, res, next) => {
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ error: "Require Admin Role!" });
    }
    next();
};
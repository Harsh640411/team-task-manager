const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth')); 
app.use('/api/tasks', require('./routes/tasks')); 

// ✅ FIX: Projects route ko yahan uncomment karna zaroori hai
// Check karo ki tumhare 'routes' folder mein 'projects.js' file exist karti hai
app.use('/api/projects', require('./routes/projects')); 

// ✅ FIX: Global Error Handler (taaki 500 error pe server crash na ho)
app.use((err, req, res, next) => {
    console.error("Global Server Error:", err.stack);
    res.status(500).json({ error: "Something went wrong on the server!" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
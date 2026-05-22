const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Strict CORS configuration
app.use(cors({
    origin: "*", 
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));    
app.use('/api/tasks', require('./routes/tasks'));  

// ✅ FIX: Isko uncomment kar diya hai (404 error ab nahi aayegi)
app.use('/api/projects', require('./routes/projects')); 

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
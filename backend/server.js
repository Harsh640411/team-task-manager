const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));     // Auth route ab ON hai
app.use('/api/tasks', require('./routes/tasks'));   // Tasks route ON hai

// Jab hum projects ka API likhenge tab isko uncomment karenge:
// app.use('/api/projects', require('./routes/projects')); 

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
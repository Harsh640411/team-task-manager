const mysql = require('mysql2/promise');
require('dotenv').config();

async function setup() {
    try {
        console.log("Connecting to Railway Cloud DB...");
        const db = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        });

        console.log("Creating Users Table...");
        // Added fullName and jobTitle to store signup data
        await db.execute(`CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) UNIQUE NOT NULL,
            fullName VARCHAR(100),
            jobTitle VARCHAR(100),
            password_hash VARCHAR(255) NOT NULL,
            role ENUM('Admin', 'Member') DEFAULT 'Member',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        console.log("Creating Projects Table...");
        await db.execute(`CREATE TABLE IF NOT EXISTS projects (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            created_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
        )`);

        console.log("Creating Tasks Table...");
        // ✅ FIXED: Removed 'due_date' completely to stop the error
        await db.execute(`CREATE TABLE IF NOT EXISTS tasks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            project_id INT NOT NULL,
            title VARCHAR(100) NOT NULL,
            description TEXT,
            assigned_to INT,
            status ENUM('Pending', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
        )`);

        console.log("✅ All Tables Created/Updated Successfully!");
        process.exit();
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

setup();
# 🚀 Team Task Manager (Task Track)

**Team Task Manager (Task Track)** ek full-stack, cloud-native application hai jise specifically teams ki productivity aur task management ko streamline karne ke liye design kiya gaya hai. Ye platform users ko tasks create karne, attendance mark karne aur leaves manage karne ki suvidha deta hai, jabki Admins ko team performance track karne ke liye advanced analytics provide karta hai.

## 📋 Features
* **Role-Based Access Control:** Admin/Quality Reviewer aur Tasker ke liye specific roles.
* **Cloud-Native Architecture:** AWS (S3, Elastic Beanstalk, DynamoDB) par deploy hone ke liye optimized.
* **Real-time Attendance:** Integrated punch-in/out system session tracking ke saath.
* **Leave Management:** Automated leave application aur approval workflow.
* **Analytics Dashboard:** Leaderboard aur team shift metrics ka real-time visualization.
* **Project Allocation:** Specific projects ke liye task segmentation.

## 🛠 Tech Stack
| **Technology** | **Purpose** |
|---------------|------------|
| **Frontend** | React.js, Axios, React Router, Custom CSS |
| **Backend** | Node.js, Express.js, JWT Authentication |
| **Database** | MySQL (Hosted on Railway) |
| **Cloud/Infra** | Railway, AWS (S3, Elastic Beanstalk) |

## 📂 Folder Structure
```
📁 team-task-manager
├── 📂 backend
│   ├── 📂 routes          # API Routes (auth, tasks, projects, leaves)
│   ├── 📂 middleware      # Auth Token Verification
│   ├── 📂 config          # Database Connection
│   └── 📄 server.js       # Main Express Server
├── 📂 frontend
│   ├── 📂 src
│   │   ├── 📂 components  # AdminDashboard, UI components
│   │   ├── 📂 pages       # Login, Signup, Dashboard, ProjectView
│   │   └── 📄 App.jsx     # Route Configuration
├── 📄 README.md           # Project Documentation
└── 📄 .env                # Environment Variables
```
---
## 🚀 Setup & Installation

### ✅ Prerequisites
- Node.js (v16+)
- VITE
- MySQL Server
- npm or yarn

### 🔽 Step 1: Clone the Repository
```sh
git clone [https://github.com/Harsh64041/team-task-manager.git](https://github.com/Harsh64041/team-task-manager.git)
cd team-task-manager
```

### 📦 Step 2: Install Dependencies**
- **Backend Dependencies**
```sh
cd Backend
npm install
```
- **Frontend Dependencies**
 ```sh
cd ../frontend
npm install
```

### 🛢️ Step 3: Environment Setup(.env)**
```
# Server Configuration
PORT=5000

# Database Configuration (Railway MySQL)
DB_HOST=containers-us-west-xx.railway.app
DB_USER=root
DB_PASSWORD=your_db_password
DB_NAME=railway
DB_PORT=5000

# Security
JWT_SECRET=your_super_secret_key_123

# CORS Policy (Allow your frontend URL here)
FRONTEND_URL=http://localhost:5173
```

### ▶️ Step 4: Run the Application
```
# Start backend
cd backend
node server.js

# Start frontend
cd ../frontend
npm start
```

### 💡 Key Functionalities
* Intelligent Shift Tracking: Automated punch-in/out system with a robust 08:00 AM daily reset mechanism for accurate shift logging.
* Productivity Analytics: A real-time leaderboard engine that ranks team members based on task completion and performance metrics.
* Project-Centric Auditing: Advanced segmentation that maps tasks to specific projects, enabling precise progress oversight.
* Streamlined Leave Workflow: Centralized request management with automated status tracking and real-time team availability syncing.
* Operational Telemetry: Interactive data visualization for team shifts, workload distribution, and audit efficiency.


### 🤝 Contribution

Contributions are welcome! To contribute:

Fork the repository.
Create a feature branch (git checkout -b feature-branch).
Commit your changes (git commit -m "Add new feature").
Push to the branch (git push origin feature-branch).
Open a Pull Request.


### 📧 Contact & Support

For any queries, reach out to:
👤 Praphool Rathore
📩 Email: praphoolrathore2003@gmail.com
🔗 LinkedIn: [Connect with me](www.linkedin.com/in/harshvardhan-sharma-246919297)
🌍 GitHub: [Project Repository](https://github.com/praphoolrathore/face_recognition_system)
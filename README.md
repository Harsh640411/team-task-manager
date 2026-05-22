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
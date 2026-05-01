# 🚀 Team Task Manager

A full-stack **Team Task Manager** application built as a timed assessment project. It enables teams to manage projects, assign tasks, track progress, and submit deliverables — all with secure role-based access control.

> **Live Demo**  
> 🌐 Frontend (Vercel): [https://task-manager-e3i4udjs0-akshxt20s-projects.vercel.app](https://task-manager-e3i4udjs0-akshxt20s-projects.vercel.app)  
> ⚙️ Backend (Railway): *Deployed on Railway*

---

## 📸 Screenshots

<!-- Add screenshots of your app here -->
<!-- ![Dashboard](./screenshots/dashboard.png) -->
<!-- ![Tasks](./screenshots/tasks.png) -->

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI library for building component-based interfaces |
| **React Router DOM v7** | Client-side routing & navigation |
| **Axios** | HTTP client for API communication |
| **Tailwind CSS v4** | Utility-first CSS framework |
| **Custom CSS (Glassmorphism)** | Handcrafted glassmorphism design system with Inter font |
| **Context API** | Global state management for authentication |
| **Create React App** | Project scaffolding & build tooling |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js** | JavaScript runtime environment |
| **Express.js v5** | Web framework for REST API |
| **MySQL2** | Database driver for MySQL/MariaDB |
| **JSON Web Tokens (JWT)** | Stateless authentication |
| **bcrypt.js** | Password hashing & verification |
| **Multer** | File upload handling (multipart/form-data) |
| **express-validator** | Request validation middleware |
| **dotenv** | Environment variable management |
| **CORS** | Cross-Origin Resource Sharing |
| **Nodemon** | Auto-restart dev server on file changes |

### Database
| Technology | Purpose |
|---|---|
| **MySQL** | Relational database (hosted on Railway) |

### Deployment
| Platform | Service |
|---|---|
| **Vercel** | Frontend hosting (React SPA) |
| **Railway** | Backend hosting (Node.js API + MySQL database) |

---

## ✨ Features

### 🔐 Authentication & Authorization
- User **Signup** & **Login** with JWT-based auth
- Passwords hashed with bcrypt (10 salt rounds)
- Role-based access: **Admin** and **Member** roles
- Protected routes with auth middleware
- Token stored in localStorage with 7-day expiry

### 📁 Project Management
- Create, view, and delete projects
- Auto-assign project creator as **admin**
- Add/remove team members by email lookup
- Members see all projects; admins see only their own
- Per-project role management (admin/member)

### ✅ Task Management
- Full CRUD operations on tasks
- Assign tasks to specific team members
- Priority levels: **High**, **Medium**, **Low**
- Status tracking: **To Do**, **In Progress**, **Done**
- Due date management with overdue detection
- Admins can edit all task fields; members can update status only

### 📤 Task Submissions
- Multiple submission types: **Text**, **File Upload**, **Custom Input**
- File uploads up to **10MB** via Multer
- Submission instructions per task (set by admin)
- Auto-marks task as **Done** on submission
- View all submissions for a task

### 📊 Dashboard & Analytics
- Total tasks assigned to current user
- Tasks grouped by status (To Do / In Progress / Done)
- Overdue task count
- Per-user task distribution (admin view)
- Stat cards with animated progress bars

### 🎨 UI/UX
- **Glassmorphism** design system with blur effects
- Dark gradient background with floating animated orbs
- Smooth micro-animations & staggered transitions
- Inter font family (Google Fonts)
- Responsive sidebar navigation
- Color-coded badges for roles, priorities, and statuses

---

## 📂 Project Structure

```
team-task-manager/
├── backend/
│   ├── middleware/
│   │   ├── auth.js            # JWT verification middleware
│   │   ├── isAdmin.js         # Project-level admin check
│   │   └── isMember.js        # Project-level member check
│   ├── routes/
│   │   ├── auth.js            # Signup, Login, User lookup
│   │   ├── projects.js        # CRUD projects, manage members
│   │   ├── tasks.js           # CRUD tasks, submissions, file uploads
│   │   └── dashboard.js       # Analytics & stats
│   ├── uploads/               # Uploaded files directory
│   ├── db.js                  # MySQL connection pool
│   ├── migrate.js             # Database migration script
│   ├── addRole.js             # Utility to add roles
│   ├── index.js               # Express app entry point
│   ├── package.json
│   └── .env                   # Environment variables (not committed)
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/               # Axios instance & API config
│   │   ├── components/
│   │   │   ├── Layout.jsx     # Sidebar + main content layout
│   │   │   ├── Navbar.jsx     # Navigation bar
│   │   │   ├── PrivateRoute.jsx # Auth route guard
│   │   │   └── TaskCard.jsx   # Task display card
│   │   ├── context/
│   │   │   └── AuthContext.js # Auth state provider
│   │   ├── pages/
│   │   │   ├── Login.jsx      # Login page
│   │   │   ├── Signup.jsx     # Signup page
│   │   │   ├── Dashboard.jsx  # Dashboard with stats
│   │   │   ├── Projects.jsx   # Project listing & management
│   │   │   ├── Tasks.jsx      # Task management & submissions
│   │   │   └── TaskBoard.jsx  # Kanban-style task board
│   │   ├── App.jsx            # Root component with routes
│   │   └── index.css          # Global styles & design system
│   ├── package.json
│   └── .env                   # Frontend environment variables
│
├── .gitignore
└── README.md
```

---

## 🗄️ Database Schema

```sql
-- Users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'member') DEFAULT 'member',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Project Members (many-to-many)
CREATE TABLE project_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('admin', 'member') DEFAULT 'member',
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tasks table
CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('todo', 'inprogress', 'done') DEFAULT 'todo',
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  due_date DATE,
  assigned_to INT,
  created_by INT,
  submission_type VARCHAR(255) DEFAULT NULL,
  submission_instructions TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Task Submissions table
CREATE TABLE task_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  user_id INT NOT NULL,
  text_content TEXT DEFAULT NULL,
  file_name VARCHAR(255) DEFAULT NULL,
  file_path VARCHAR(500) DEFAULT NULL,
  custom_content TEXT DEFAULT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 🏗️ API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/signup` | Register a new user | ❌ |
| `POST` | `/login` | Login & receive JWT token | ❌ |
| `GET` | `/user-by-email?email=` | Find user by email | ✅ |
| `GET` | `/all-members` | Get all members | ✅ |

### Projects (`/api/projects`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/` | Create a new project | ✅ |
| `GET` | `/` | Get all projects | ✅ |
| `GET` | `/:id` | Get single project | ✅ |
| `GET` | `/:id/my-role` | Get current user's role | ✅ |
| `GET` | `/:id/members` | Get project members | ✅ |
| `POST` | `/:id/members` | Add member (admin) | ✅ 🔒 |
| `DELETE` | `/:id/members/:uid` | Remove member (admin) | ✅ 🔒 |
| `DELETE` | `/:id` | Delete project (admin) | ✅ 🔒 |

### Tasks (`/api/tasks`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/` | Create task (admin) | ✅ 🔒 |
| `GET` | `/?project_id=` | Get project tasks | ✅ |
| `GET` | `/:id` | Get single task | ✅ |
| `GET` | `/:id/submissions` | Get task submissions | ✅ |
| `POST` | `/:id/submit` | Submit task work | ✅ |
| `PUT` | `/:id` | Update task | ✅ |
| `DELETE` | `/:id` | Delete task (admin) | ✅ 🔒 |

### Dashboard (`/api/dashboard`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/` | Get dashboard analytics | ✅ |

> ✅ = Requires JWT &nbsp; | &nbsp; 🔒 = Admin only

---

## ⚡ Local Development Setup

### Prerequisites
- **Node.js** v18+
- **MySQL** server running locally or remotely
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/akshxt20/task-manager.git
cd team-task-manager
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=task_manager
DB_PORT=3306
JWT_SECRET=your_super_secret_jwt_key
PORT=5000
```

Set up the database:
```bash
# Create the database manually in MySQL first:
# CREATE DATABASE task_manager;

# Run migrations
node migrate.js
```

Start the backend:
```bash
npm run dev    # Development (with auto-reload)
npm start      # Production
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/`:
```env
REACT_APP_API_URL=http://localhost:5000
```

Start the frontend:
```bash
npm start
```

The app will be available at `http://localhost:3000`.

---

## 🚀 Deployment Guide

### Deploying Backend on Railway

[Railway](https://railway.app) provides easy deployment for Node.js apps and managed MySQL databases.

#### Step 1: Create a Railway Account
1. Go to [railway.app](https://railway.app) and sign up (GitHub login recommended)
2. Click **"New Project"**

#### Step 2: Add a MySQL Database
1. In your Railway project, click **"+ New"** → **"Database"** → **"MySQL"**
2. Railway will provision a MySQL instance automatically
3. Go to the MySQL service → **"Variables"** tab to find your credentials:
   - `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_PORT`

#### Step 3: Deploy the Backend
1. Click **"+ New"** → **"GitHub Repo"** → select your repository
2. In **Settings**, set the **Root Directory** to `backend`
3. Railway will auto-detect it as a Node.js app
4. Go to **"Variables"** and add:
   ```
   DB_HOST=<MYSQL_HOST from step 2>
   DB_USER=<MYSQL_USER>
   DB_PASSWORD=<MYSQL_PASSWORD>
   DB_NAME=<MYSQL_DATABASE>
   DB_PORT=<MYSQL_PORT>
   JWT_SECRET=<your_secret_key>
   PORT=5000
   ```
5. Go to **Settings** → **Networking** → click **"Generate Domain"** to get a public URL
6. Copy the generated URL (e.g., `https://your-app.up.railway.app`)

#### Step 4: Run Migrations
1. In Railway, go to your backend service
2. Open the **"Shell"** tab (or use Railway CLI)
3. Run: `node migrate.js`

> **Tip:** You can also use the Railway CLI locally:
> ```bash
> npm install -g @railway/cli
> railway login
> railway link
> railway run node migrate.js
> ```

---

### Deploying Frontend on Vercel

[Vercel](https://vercel.com) is optimized for frontend frameworks like React.

#### Step 1: Create a Vercel Account
1. Go to [vercel.com](https://vercel.com) and sign up (GitHub login recommended)

#### Step 2: Import Your Repository
1. Click **"Add New..."** → **"Project"**
2. Select your GitHub repository
3. Configure the project:
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

#### Step 3: Set Environment Variables
1. In the Vercel project settings, go to **"Environment Variables"**
2. Add:
   ```
   REACT_APP_API_URL=https://your-backend.up.railway.app
   ```
   *(Use the Railway backend URL from the previous section)*

#### Step 4: Deploy
1. Click **"Deploy"**
2. Vercel will build and deploy your React app automatically
3. You'll get a live URL (e.g., `https://your-app.vercel.app`)

#### Step 5: Update Backend CORS
After deploying the frontend, update the backend's CORS configuration in `backend/index.js`:
```javascript
app.use(cors({
  origin: "https://your-app.vercel.app",
  credentials: true
}));
```
Commit and push — Railway will auto-redeploy.

---

## 🔄 CI/CD

Both platforms support **automatic deployments**:
- **Railway**: Pushes to the `main` branch auto-deploy the backend
- **Vercel**: Pushes to the `main` branch auto-deploy the frontend

---

## 🧑‍💻 Author

**Akshat Srivastava**  
GitHub: [@akshxt20](https://github.com/akshxt20)

---

## 📝 License

This project was built as part of a timed assessment. Feel free to use it as a reference.

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors({
  origin:[
    "http://localhost:3000",
    "https://task-manager-e3i4udjs0-akshxt20s-projects.vercel.app",
    "https://task-manager-production-552a.up.railway.app",
    /\.vercel\.app$/   // allows any Vercel preview deployment URLs
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Team Task Manager API is running' });
});

// 404 handler - MUST come before error handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler - MUST be last
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

const PORT = process.env.PORT || 5000;

// Run migrations on startup, then start listening
const migrate = require('./migrate');
migrate()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Migration failed, starting server anyway:', err.message);
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT} (migration failed)`);
    });
  });

const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// CREATE TASK — admin only
router.post('/', auth, async (req, res) => {
  try {
    const { project_id, title, description, due_date, priority, assigned_to, submission_type, submission_instructions } = req.body;

    if (!project_id || !title) {
      return res.status(400).json({ error: 'project_id and title are required' });
    }

    // Check if user is admin of this project
    const [member] = await pool.query(
      'SELECT role FROM project_members WHERE project_id=? AND user_id=?',
      [project_id, req.user.id]
    );

    if (!member[0] || member[0].role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create tasks' });
    }

    await pool.query(
      `INSERT INTO tasks 
       (project_id, title, description, due_date, priority, assigned_to, created_by, submission_type, submission_instructions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [project_id, title, description, due_date, priority || 'medium', assigned_to, req.user.id, submission_type || null, submission_instructions || null]
    );

    res.status(201).json({ message: 'Task created successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task', details: err.message });
  }
});

// GET ALL TASKS FOR A PROJECT
router.get('/', auth, async (req, res) => {
  try {
    const { project_id } = req.query;

    if (!project_id) {
      return res.status(400).json({ error: 'project_id is required' });
    }

    // Check if user has access
    const [member] = await pool.query(
      'SELECT role FROM project_members WHERE project_id=? AND user_id=?',
      [project_id, req.user.id]
    );

    if (!member[0]) {
      const [userRows] = await pool.query('SELECT role FROM users WHERE id=?', [req.user.id]);
      if (!userRows[0] || userRows[0].role !== 'member') {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const [rows] = await pool.query(
      `SELECT t.*, u.name as assigned_to_name 
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.project_id = ?
       ORDER BY t.created_at DESC`,
      [project_id]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks', details: err.message });
  }
});

// GET SINGLE TASK
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM tasks WHERE id=?', [req.params.id]
    );
    if (!rows[0]) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch task', details: err.message });
  }
});

// GET SUBMISSIONS FOR A TASK
router.get('/:id/submissions', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ts.*, u.name as submitted_by_name 
       FROM task_submissions ts
       JOIN users u ON ts.user_id = u.id
       WHERE ts.task_id = ?
       ORDER BY ts.submitted_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch submissions', details: err.message });
  }
});

// SUBMIT TASK — member submits their work, marks task as done
router.post('/:id/submit', auth, upload.single('file'), async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;

    // Get the task
    const [task] = await pool.query('SELECT * FROM tasks WHERE id=?', [taskId]);
    if (!task[0]) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { text_content, custom_content } = req.body;

    // Validate submission based on required types
    const requiredTypes = task[0].submission_type ? task[0].submission_type.split(',') : [];
    if (requiredTypes.includes('text') && !text_content) {
      return res.status(400).json({ error: 'Text submission is required' });
    }
    if (requiredTypes.includes('file') && !req.file) {
      return res.status(400).json({ error: 'File submission is required' });
    }
    if (requiredTypes.includes('custom') && !custom_content) {
      return res.status(400).json({ error: 'Custom input submission is required' });
    }

    // Save submission
    await pool.query(
      `INSERT INTO task_submissions (task_id, user_id, text_content, file_name, file_path, custom_content)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        taskId,
        userId,
        text_content || null,
        req.file ? req.file.originalname : null,
        req.file ? req.file.filename : null,
        custom_content || null
      ]
    );

    // Mark the task as done
    await pool.query('UPDATE tasks SET status=? WHERE id=?', ['done', taskId]);

    res.json({ message: 'Task submitted and marked as completed!' });
  } catch (err) {
    res.status(500).json({ error: 'Submission failed', details: err.message });
  }
});

// UPDATE TASK — admin can update all, member can only update status
router.put('/:id', auth, async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;

    const [task] = await pool.query('SELECT * FROM tasks WHERE id=?', [taskId]);
    if (!task[0]) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const [member] = await pool.query(
      'SELECT role FROM project_members WHERE project_id=? AND user_id=?',
      [task[0].project_id, userId]
    );

    // Allow global members to update status of tasks assigned to them
    const [userRow] = await pool.query('SELECT role FROM users WHERE id=?', [userId]);
    const globalRole = userRow[0]?.role;

    if (!member[0] && globalRole !== 'member') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const role = member[0]?.role || 'member';

    if (role === 'admin') {
      const { status, priority, assigned_to, title, description, due_date } = req.body;

      await pool.query(
        `UPDATE tasks 
         SET status=?, priority=?, assigned_to=?, title=?, description=?, due_date=?
         WHERE id=?`,
        [
          status || task[0].status,
          priority || task[0].priority,
          assigned_to || task[0].assigned_to,
          title || task[0].title,
          description || task[0].description,
          due_date || task[0].due_date,
          taskId
        ]
      );
    } else {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }
      await pool.query('UPDATE tasks SET status=? WHERE id=?', [status, taskId]);
    }

    res.json({ message: 'Task updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task', details: err.message });
  }
});

// DELETE TASK — admin only
router.delete('/:id', auth, async (req, res) => {
  try {
    const [task] = await pool.query('SELECT * FROM tasks WHERE id=?', [req.params.id]);
    if (!task[0]) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const [member] = await pool.query(
      'SELECT role FROM project_members WHERE project_id=? AND user_id=?',
      [task[0].project_id, req.user.id]
    );

    if (!member[0] || member[0].role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete tasks' });
    }

    await pool.query('DELETE FROM tasks WHERE id=?', [req.params.id]);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task', details: err.message });
  }
});

module.exports = router;
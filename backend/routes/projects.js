const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const isMember = require('../middleware/isMember');

// CREATE PROJECT — any logged in user
router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const [result] = await pool.query(
      'INSERT INTO projects (name, description, created_by) VALUES (?, ?, ?)',
      [name, description, req.user.id]
    );

    // Auto assign creator as admin
    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
      [result.insertId, req.user.id, 'admin']
    );

    res.status(201).json({
      message: 'Project created successfully',
      projectId: result.insertId
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create project', details: err.message });
  }
});

// GET ALL PROJECTS for logged in user
router.get('/', auth, async (req, res) => {
  try {
    // Fetch the user's global role
    const [userRows] = await pool.query('SELECT role FROM users WHERE id=?', [req.user.id]);
    const globalRole = userRows[0]?.role;

    let rows;
    if (globalRole === 'admin') {
      // Admins see projects they are a member of
      [rows] = await pool.query(
        `SELECT p.*, pm.role as user_role 
         FROM projects p
         JOIN project_members pm ON p.id = pm.project_id
         WHERE pm.user_id = ?`,
        [req.user.id]
      );
    } else {
      // Members see ALL projects (with their project role if they have one)
      [rows] = await pool.query(
        `SELECT p.*, pm.role as user_role 
         FROM projects p
         LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = ?`,
        [req.user.id]
      );
    }

    // Default user_role to 'member' if null (not explicitly in project_members)
    rows = rows.map(r => ({ ...r, user_role: r.user_role || 'member' }));

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects', details: err.message });
  }
});

// GET SINGLE PROJECT
router.get('/:id', auth, isMember, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM projects WHERE id=?',
      [req.params.id]
    );
    if (!rows[0]) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ ...rows[0], userRole: req.userRole });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch project', details: err.message });
  }
});

// GET CURRENT USER ROLE IN PROJECT
router.get('/:id/my-role', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT role FROM project_members WHERE project_id=? AND user_id=?',
      [req.params.id, req.user.id]
    );
    if (!rows[0]) {
      return res.status(403).json({ error: 'Not a member of this project' });
    }
    res.json({ role: rows[0].role });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch role', details: err.message });
  }
});

// GET ALL MEMBERS OF A PROJECT
router.get('/:id/members', auth, isMember, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, pm.role
       FROM users u
       JOIN project_members pm ON u.id = pm.user_id
       WHERE pm.project_id = ?`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch members', details: err.message });
  }
});

// ADD MEMBER — admin only
router.post('/:id/members', auth, isAdmin, async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    // Check if user exists
    const [user] = await pool.query(
      'SELECT * FROM users WHERE id=?', [user_id]
    );
    if (!user[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already a member
    const [existing] = await pool.query(
      'SELECT * FROM project_members WHERE project_id=? AND user_id=?',
      [req.params.id, user_id]
    );
    if (existing[0]) {
      return res.status(400).json({ error: 'User is already a member' });
    }

    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
      [req.params.id, user_id, 'member']
    );

    res.json({ message: 'Member added successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add member', details: err.message });
  }
});

// REMOVE MEMBER — admin only
router.delete('/:id/members/:uid', auth, isAdmin, async (req, res) => {
  try {
    // Prevent admin from removing themselves
    if (req.params.uid == req.user.id) {
      return res.status(400).json({ error: 'Admin cannot remove themselves' });
    }

    await pool.query(
      'DELETE FROM project_members WHERE project_id=? AND user_id=?',
      [req.params.id, req.params.uid]
    );

    res.json({ message: 'Member removed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove member', details: err.message });
  }
});

// DELETE PROJECT — admin only
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE project_id=?', [req.params.id]);
    await pool.query('DELETE FROM project_members WHERE project_id=?', [req.params.id]);
    await pool.query('DELETE FROM projects WHERE id=?', [req.params.id]);

    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete project', details: err.message });
  }
});

module.exports = router;
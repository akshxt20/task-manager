const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Total tasks assigned to user
    const [total] = await pool.query(
      'SELECT COUNT(*) as total FROM tasks WHERE assigned_to=?',
      [userId]
    );

    // Tasks grouped by status
    const [byStatus] = await pool.query(
      `SELECT status, COUNT(*) as count 
       FROM tasks 
       WHERE assigned_to=? 
       GROUP BY status`,
      [userId]
    );

    // Overdue tasks
    const [overdue] = await pool.query(
      `SELECT COUNT(*) as overdue 
       FROM tasks 
       WHERE assigned_to=? 
       AND due_date < CURDATE() 
       AND status != 'done'`,
      [userId]
    );

    // Tasks per user (for admins to see)
    const [perUser] = await pool.query(
      `SELECT u.name, COUNT(t.id) as task_count
       FROM users u
       LEFT JOIN tasks t ON u.id = t.assigned_to
       GROUP BY u.id, u.name`
    );

    res.json({
      total: total[0].total,
      byStatus,
      overdue: overdue[0].overdue,
      perUser
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard data', details: err.message });
  }
});

module.exports = router;
const pool = require('../db');

const isAdmin = async (req, res, next) => {
  try {
    const projectId = req.params.id || req.body.project_id;
    const userId = req.user.id;

    const [rows] = await pool.query(
      'SELECT role FROM project_members WHERE project_id=? AND user_id=?',
      [projectId, userId]
    );

    if (!rows[0]) {
      return res.status(403).json({ error: 'You are not a member of this project' });
    }

    if (rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can perform this action' });
    }

    next(); // user is admin, allow request
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = isAdmin;
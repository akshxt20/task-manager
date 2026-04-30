require('dotenv').config();
const pool = require('./db');

async function migrate() {
  try {
    console.log('Running migrations...');

    // Add submission_type to tasks table
    const [cols] = await pool.query(`SHOW COLUMNS FROM tasks LIKE 'submission_type'`);
    if (cols.length === 0) {
      await pool.query(`ALTER TABLE tasks ADD COLUMN submission_type VARCHAR(255) DEFAULT NULL`);
      console.log('Added submission_type column to tasks.');
    }

    // Add submission_instructions to tasks table
    const [cols2] = await pool.query(`SHOW COLUMNS FROM tasks LIKE 'submission_instructions'`);
    if (cols2.length === 0) {
      await pool.query(`ALTER TABLE tasks ADD COLUMN submission_instructions TEXT DEFAULT NULL`);
      console.log('Added submission_instructions column to tasks.');
    }

    // Create task_submissions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS task_submissions (
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
      )
    `);
    console.log('task_submissions table ready.');

    console.log('All migrations complete!');
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    process.exit();
  }
}

migrate();

require('dotenv').config();
const pool = require('./db');

async function migrate() {
  try {
    console.log('Running migrations...');

    // -------------------------------------------------------------------------
    // 1. users — must exist before any table that references it
    // -------------------------------------------------------------------------
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        name        VARCHAR(255) NOT NULL,
        email       VARCHAR(255) NOT NULL UNIQUE,
        password    VARCHAR(255) NOT NULL,
        role        VARCHAR(50)  NOT NULL DEFAULT 'member',
        created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('users table ready.');

      // -------------------------------------------------------------------------
    // 2. projects — references users(id) via created_by
    // -------------------------------------------------------------------------
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        name        VARCHAR(255) NOT NULL,
        description TEXT         DEFAULT NULL,
        created_by  INT          NOT NULL,
        created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('projects table ready.');

    // -------------------------------------------------------------------------
    // 3. project_members — join table between projects and users
    // -------------------------------------------------------------------------
    await pool.query(`
      CREATE TABLE IF NOT EXISTS project_members (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        project_id  INT         NOT NULL,
        user_id     INT         NOT NULL,
        role        VARCHAR(50) NOT NULL DEFAULT 'member',
        UNIQUE KEY uq_project_user (project_id, user_id),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE
      )
    `);
    console.log('project_members table ready.');

    // -------------------------------------------------------------------------
    // 4. tasks — references projects(id) and users(id)
    // -------------------------------------------------------------------------
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id                      INT AUTO_INCREMENT PRIMARY KEY,
        project_id              INT          NOT NULL,
        title                   VARCHAR(255) NOT NULL,
        description             TEXT         DEFAULT NULL,
        due_date                DATE         DEFAULT NULL,
        priority                VARCHAR(50)  NOT NULL DEFAULT 'medium',
        assigned_to             INT          DEFAULT NULL,
        created_by              INT          DEFAULT NULL,
        status                  VARCHAR(50)  NOT NULL DEFAULT 'todo',
        submission_type         VARCHAR(255) DEFAULT NULL,
        submission_instructions TEXT         DEFAULT NULL,
        created_at              TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id)  REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_to) REFERENCES users(id)    ON DELETE SET NULL,
        FOREIGN KEY (created_by)  REFERENCES users(id)    ON DELETE SET NULL
      )
    `);
    console.log('tasks table ready.');

    // -------------------------------------------------------------------------
    // 5. Column migrations — add columns that may be missing from older tasks
    //    tables created before these fields were introduced
    // -------------------------------------------------------------------------
    const [cols] = await pool.query(`SHOW COLUMNS FROM tasks LIKE 'submission_type'`);
    if (cols.length === 0) {
      await pool.query(`ALTER TABLE tasks ADD COLUMN submission_type VARCHAR(255) DEFAULT NULL`);
      console.log('Added submission_type column to tasks.');
    }

    const [cols2] = await pool.query(`SHOW COLUMNS FROM tasks LIKE 'submission_instructions'`);
    if (cols2.length === 0) {
      await pool.query(`ALTER TABLE tasks ADD COLUMN submission_instructions TEXT DEFAULT NULL`);
      console.log('Added submission_instructions column to tasks.');
    }

    // -------------------------------------------------------------------------
    // 6. task_submissions — references tasks(id) and users(id)
    // -------------------------------------------------------------------------
    await pool.query(`
      CREATE TABLE IF NOT EXISTS task_submissions (
        id             INT AUTO_INCREMENT PRIMARY KEY,
        task_id        INT          NOT NULL,
        user_id        INT          NOT NULL,
        text_content   TEXT         DEFAULT NULL,
        file_name      VARCHAR(255) DEFAULT NULL,
        file_path      VARCHAR(500) DEFAULT NULL,
        custom_content TEXT         DEFAULT NULL,
        submitted_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id)  REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id)  REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('task_submissions table ready.');

    console.log('All migrations complete!');
  } catch (err) {
    console.error('Migration error:', err.message);
    throw err;
  }
}

// Allow the file to be run directly: `node migrate.js`
if (require.main === module) {
  migrate().finally(() => process.exit());
}

module.exports = migrate;


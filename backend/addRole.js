require('dotenv').config();
const pool = require('./db');

async function addRoleColumn() {
  try {
    console.log('Checking if role column exists...');
    const [columns] = await pool.query(`SHOW COLUMNS FROM users LIKE 'role'`);
    if (columns.length === 0) {
      console.log('Adding role column to users table...');
      await pool.query(`ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'member'`);
      console.log('Role column added successfully.');
    } else {
      console.log('Role column already exists.');
    }
  } catch (error) {
    console.error('Error updating schema:', error.message);
  } finally {
    process.exit();
  }
}

addRoleColumn();

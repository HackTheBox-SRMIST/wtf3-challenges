const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'data', 'banco.db');

fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

//Schema 
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id       TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name     TEXT NOT NULL,
    role     TEXT DEFAULT 'customer',
    balance  REAL DEFAULT 10000.00,
    notes    TEXT DEFAULT ''
  )
`);

// Seed: The Professor 
const professorId = uuidv4();

db.prepare('DELETE FROM users WHERE role = ?').run('employee');

const professorPassword = bcrypt.hashSync('bella_ciao_professor_2024', 10);

const hostageNote = `HEIST LOG — Entry #7

If you're reading this, we've already breached the outer perimeter. Berlin has secured the east wing, and I've rerouted all the internal feeds. They think they still control the cameras, but Denver's loop has been running for 47 minutes now.

The Governor thought he was safe in his office at /mint/governor — surrounded by armed guards and reinforced steel. But we don't need to break down doors when we can walk right through walls.

Nairobi says the plates are almost ready. Helsinki and Oslo are holding Vault B. Moscow's tunnel should reach the foundation within the hour.

Remember the plan. No names. No faces. No mistakes.

— Tokyo`;

db.prepare(`
  INSERT INTO users (id, username, password, name, role, balance, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(
  professorId,
  'professor',
  professorPassword,
  'Sergio Marquina',
  'employee',
  999999999.99,
  hostageNote
);

console.log(`[DB] Professor seeded with UUID: ${professorId}`);

module.exports = { db, professorId };

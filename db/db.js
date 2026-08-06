// db/db.js — sets up the SQLite database and creates tables if they don't exist yet
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'parking.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_number TEXT UNIQUE NOT NULL,
    owner_name TEXT NOT NULL,
    phone TEXT,
    vehicle_type TEXT CHECK(vehicle_type IN ('CAR','BIKE')) NOT NULL,
    subscription_end TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS daily_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_number TEXT NOT NULL,
    vehicle_type TEXT NOT NULL,
    is_subscriber INTEGER NOT NULL DEFAULT 0,
    amount_charged REAL NOT NULL DEFAULT 0,
    entry_time TEXT NOT NULL DEFAULT (datetime('now')),
    status TEXT DEFAULT 'ACTIVE'
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    description TEXT NOT NULL,
    expense_date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

module.exports = db;

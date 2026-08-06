// services/expense.service.js — logging and totaling daily expenses
const db = require('../db/db');

function addExpense({ amount, description, expenseDate }) {
  const stmt = db.prepare(
    `INSERT INTO expenses (amount, description, expense_date) VALUES (?, ?, ?)`
  );
  return stmt.run(amount, description, expenseDate);
}

function listExpenses() {
  return db.prepare(`SELECT * FROM expenses ORDER BY expense_date DESC, id DESC`).all();
}

function totalExpenses() {
  const row = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM expenses`).get();
  return row.total;
}

module.exports = { addExpense, listExpenses, totalExpenses };

// services/expense.service.js — logging and totaling daily expenses
const { loadData, saveData } = require('../db/db');

function addExpense({ amount, description, expenseDate }) {
  const data = loadData();
  const newExpense = {
    id: data.nextIds.expense++,
    amount: parseFloat(amount),
    description,
    expense_date: expenseDate,
  };
  data.expenses.push(newExpense);
  saveData(data);
  return newExpense;
}

function listExpenses() {
  const data = loadData();
  return [...data.expenses].sort((a, b) => b.expense_date.localeCompare(a.expense_date) || b.id - a.id);
}

function totalExpenses() {
  const data = loadData();
  return data.expenses.reduce((sum, e) => sum + e.amount, 0);
}

module.exports = { addExpense, listExpenses, totalExpenses };

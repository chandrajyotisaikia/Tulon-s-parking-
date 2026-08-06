// controllers/parking.controller.js — receives requests, calls services, sends responses
const db = require('../db/db');
const { calculateCharge } = require('../services/pricing.service');
const { checkSubscriber, addSubscriber, listSubscribers } = require('../services/subscriber.service');
const { addExpense, listExpenses, totalExpenses } = require('../services/expense.service');

// POST /api/verify-and-log
function verifyAndLog(req, res) {
  const { vehicleNumber, vehicleType } = req.body;
  if (!vehicleNumber || !vehicleType) {
    return res.status(400).json({ success: false, error: 'vehicleNumber and vehicleType are required' });
  }
  try {
    const subscriber = checkSubscriber(vehicleNumber);
    const isSubscriber = !!subscriber;
    const amount = calculateCharge(vehicleType, isSubscriber);
    const plate = vehicleNumber.toUpperCase().replace(/\s+/g, '');

    const stmt = db.prepare(
      `INSERT INTO daily_entries (vehicle_number, vehicle_type, is_subscriber, amount_charged)
       VALUES (?, ?, ?, ?)`
    );
    const result = stmt.run(plate, vehicleType.toUpperCase(), isSubscriber ? 1 : 0, amount);

    return res.status(201).json({
      success: true,
      entryId: result.lastInsertRowid,
      vehicleNumber: plate,
      vehicleType: vehicleType.toUpperCase(),
      isSubscriber,
      subscriberName: subscriber ? subscriber.owner_name : null,
      amount,
      message: isSubscriber ? 'Subscriber — no charge' : `Entry logged. Charge: ₹${amount}`,
    });
  } catch (err) {
    console.error('[verifyAndLog]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/check-subscriber/:plate
function quickCheckSubscriber(req, res) {
  const subscriber = checkSubscriber(req.params.plate);
  return res.json({
    success: true,
    isSubscriber: !!subscriber,
    ownerName: subscriber ? subscriber.owner_name : null,
    vehicleType: subscriber ? subscriber.vehicle_type : null,
  });
}

// GET /api/entries
function getEntries(req, res) {
  const rows = db.prepare(`SELECT * FROM daily_entries ORDER BY entry_time DESC LIMIT 20`).all();
  return res.json({ success: true, entries: rows });
}

// POST /api/subscribers
function postSubscriber(req, res) {
  const { vehicleNumber, ownerName, phone, vehicleType, subscriptionEnd } = req.body;
  if (!vehicleNumber || !ownerName || !vehicleType || !subscriptionEnd) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }
  try {
    addSubscriber({ vehicleNumber, ownerName, phone, vehicleType, subscriptionEnd });
    return res.status(201).json({ success: true });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

// GET /api/subscribers
function getSubscribers(req, res) {
  return res.json({ success: true, subscribers: listSubscribers() });
}

// POST /api/expenses
function postExpense(req, res) {
  const { amount, description, expenseDate } = req.body;
  if (!amount || !description || !expenseDate) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }
  addExpense({ amount, description, expenseDate });
  return res.status(201).json({ success: true });
}

// GET /api/expenses
function getExpenses(req, res) {
  return res.json({ success: true, expenses: listExpenses() });
}

// GET /api/summary — totals for the desktop dashboard
function getSummary(req, res) {
  const income = db.prepare(`SELECT COALESCE(SUM(amount_charged), 0) as total FROM daily_entries`).get().total;
  const expenses = totalExpenses();
  return res.json({
    success: true,
    totalIncome: income,
    totalExpenses: expenses,
    net: income - expenses,
  });
}

module.exports = {
  verifyAndLog, quickCheckSubscriber, getEntries,
  postSubscriber, getSubscribers,
  postExpense, getExpenses, getSummary,
};

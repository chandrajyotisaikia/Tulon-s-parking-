// services/subscriber.service.js — everything to do with checking/managing subscribers
const db = require('../db/db');

function checkSubscriber(vehicleNumber) {
  const plate = vehicleNumber.toUpperCase().replace(/\s+/g, '');
  const row = db.prepare(
    `SELECT * FROM subscribers WHERE vehicle_number = ? AND subscription_end >= date('now')`
  ).get(plate);
  return row || null;
}

function addSubscriber({ vehicleNumber, ownerName, phone, vehicleType, subscriptionEnd }) {
  const plate = vehicleNumber.toUpperCase().replace(/\s+/g, '');
  const stmt = db.prepare(
    `INSERT INTO subscribers (vehicle_number, owner_name, phone, vehicle_type, subscription_end)
     VALUES (?, ?, ?, ?, ?)`
  );
  return stmt.run(plate, ownerName, phone || '', vehicleType.toUpperCase(), subscriptionEnd);
}

function listSubscribers() {
  return db.prepare(`SELECT * FROM subscribers ORDER BY subscription_end DESC`).all();
}

module.exports = { checkSubscriber, addSubscriber, listSubscribers };

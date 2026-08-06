// services/subscriber.service.js — everything to do with checking/managing subscribers
const { loadData, saveData } = require('../db/db');

function checkSubscriber(vehicleNumber) {
  const plate = vehicleNumber.toUpperCase().replace(/\s+/g, '');
  const data = loadData();
  const today = new Date().toISOString().split('T')[0];
  return data.subscribers.find(s => s.vehicle_number === plate && s.subscription_end >= today) || null;
}

function addSubscriber({ vehicleNumber, ownerName, phone, vehicleType, subscriptionEnd }) {
  const plate = vehicleNumber.toUpperCase().replace(/\s+/g, '');
  const data = loadData();
  if (data.subscribers.some(s => s.vehicle_number === plate)) {
    throw new Error('A subscriber with this vehicle number already exists');
  }
  const newSub = {
    id: data.nextIds.subscriber++,
    vehicle_number: plate,
    owner_name: ownerName,
    phone: phone || '',
    vehicle_type: vehicleType.toUpperCase(),
    subscription_end: subscriptionEnd,
  };
  data.subscribers.push(newSub);
  saveData(data);
  return newSub;
}

function listSubscribers() {
  const data = loadData();
  return [...data.subscribers].sort((a, b) => b.subscription_end.localeCompare(a.subscription_end));
}

module.exports = { checkSubscriber, addSubscriber, listSubscribers };

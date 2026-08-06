// admin.js — handles login gate, dashboard data loading, and subscriber/expense forms

const ADMIN_PASSWORD = 'LoginPwd'; // NOTE: this is a basic access gate, not real security

function tryLogin() {
  const entered = document.getElementById('loginPassword').value;
  if (entered === ADMIN_PASSWORD) {
    sessionStorage.setItem('adminLoggedIn', 'true');
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    loadAll();
  } else {
    document.getElementById('loginError').textContent = 'Incorrect password.';
  }
}

// Stay logged in for this browser tab/session
if (sessionStorage.getItem('adminLoggedIn') === 'true') {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  loadAll();
}

function showAdminTab(tab) {
  const panels = { entries: 'entriesPanel', subs: 'subsPanel', addsub: 'addsubPanel', expenses: 'expensesPanel' };
  const tabs = { entries: 'tabEntries', subs: 'tabSubs', addsub: 'tabAddSub', expenses: 'tabExpenses' };
  Object.keys(panels).forEach(key => {
    document.getElementById(panels[key]).style.display = key === tab ? 'block' : 'none';
    document.getElementById(tabs[key]).classList.toggle('active', key === tab);
  });
}

async function loadAll() {
  await loadSummary();
  await loadEntries();
  await loadSubscribers();
  await loadExpenses();
}

async function loadSummary() {
  const res = await fetch('/api/summary');
  const data = await res.json();
  document.getElementById('sumIncome').textContent = `₹${data.totalIncome}`;
  document.getElementById('sumExpense').textContent = `₹${data.totalExpenses}`;
  document.getElementById('sumNet').textContent = `₹${data.net}`;
}

async function loadEntries() {
  const res = await fetch('/api/entries');
  const data = await res.json();
  document.getElementById('entriesBody').innerHTML = data.entries.map(e => `
    <tr><td>${e.vehicle_number}</td><td>${e.vehicle_type}</td><td>₹${e.amount_charged}</td><td>${e.entry_time}</td></tr>
  `).join('');
}

async function loadSubscribers() {
  const res = await fetch('/api/subscribers');
  const data = await res.json();
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('subsBody').innerHTML = data.subscribers.map(s => {
    const expired = s.subscription_end < today;
    return `<tr class="${expired ? 'expired' : ''}"><td>${s.vehicle_number}</td><td>${s.owner_name}</td><td>${s.phone || ''}</td><td>${s.subscription_end}</td></tr>`;
  }).join('');
}

async function loadExpenses() {
  const res = await fetch('/api/expenses');
  const data = await res.json();
  document.getElementById('expensesBody').innerHTML = data.expenses.map(e => `
    <tr><td>${e.expense_date}</td><td>${e.description}</td><td>₹${e.amount}</td></tr>
  `).join('');
}

async function addSubscriber() {
  const vehicleNumber = document.getElementById('newPlate').value.trim();
  const ownerName = document.getElementById('newOwner').value.trim();
  const phone = document.getElementById('newPhone').value.trim();
  const vehicleType = document.getElementById('newType').value;
  const subscriptionEnd = document.getElementById('newEnd').value;
  const resultEl = document.getElementById('addSubResult');

  if (!vehicleNumber || !ownerName || !subscriptionEnd) {
    resultEl.innerHTML = `<div class="result paid">Please fill in plate, owner name, and expiry date.</div>`;
    return;
  }
  try {
    const res = await fetch('/api/subscribers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleNumber, ownerName, phone, vehicleType, subscriptionEnd }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Unknown error');
    resultEl.innerHTML = `<div class="result sub">Subscriber added.</div>`;
    ['newPlate','newOwner','newPhone','newEnd'].forEach(id => document.getElementById(id).value = '');
    loadSubscribers();
  } catch (err) {
    resultEl.innerHTML = `<div class="result paid">Error: ${err.message}</div>`;
  }
}

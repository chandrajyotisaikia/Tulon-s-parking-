// gate.js — handles the gate check-in screen: manual entry, camera OCR scan, and expense logging

let selectedType = 'CAR';

function selectType(type) {
  selectedType = type;
  document.getElementById('btnCar').classList.toggle('selected', type === 'CAR');
  document.getElementById('btnBike').classList.toggle('selected', type === 'BIKE');
}

function showTab(tab) {
  document.getElementById('gateSection').style.display = tab === 'gate' ? 'block' : 'none';
  document.getElementById('expenseSection').style.display = tab === 'expense' ? 'block' : 'none';
  document.getElementById('tabGate').classList.toggle('active', tab === 'gate');
  document.getElementById('tabExpense').classList.toggle('active', tab === 'expense');
}

// ---- Camera OCR scanning ----
// Step-by-step status is shown on screen so it's obvious where it fails if it fails.

function startScan() {
  document.getElementById('cameraInput').click();
}

document.getElementById('cameraInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const statusEl = document.getElementById('ocrStatus');
  statusEl.textContent = '📷 Photo captured. Loading OCR engine...';

  try {
    // Preprocess: draw to canvas, convert to grayscale + boost contrast — improves plate OCR accuracy
    const imageBitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageBitmap, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
      const contrasted = gray > 120 ? 255 : 0; // simple threshold, good for plate text
      data[i] = data[i + 1] = data[i + 2] = contrasted;
    }
    ctx.putImageData(imgData, 0, 0);

    statusEl.textContent = '🔍 Reading plate text (first scan can take ~30s to load model)...';

    const result = await Tesseract.recognize(canvas, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          statusEl.textContent = `🔍 Reading plate... ${Math.round(m.progress * 100)}%`;
        }
      },
    });

    const rawText = result.data.text || '';
    const cleaned = rawText.toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (!cleaned) {
      statusEl.textContent = "⚠️ Couldn't read the plate — try again or type it manually below.";
      return;
    }

    document.getElementById('plateInput').value = cleaned;
    statusEl.textContent = `✅ Recognized: "${cleaned}" — please check it's correct before confirming.`;
  } catch (err) {
    console.error('[OCR error]', err);
    statusEl.textContent = "⚠️ Scan failed — try again or type the plate manually below.";
  } finally {
    e.target.value = ''; // reset so the same photo can be retaken if needed
  }
});

// ---- Check-in submit ----
async function checkIn() {
  const plate = document.getElementById('plateInput').value.trim();
  const resultBox = document.getElementById('resultBox');
  if (!plate) {
    resultBox.innerHTML = `<div class="result paid">Please enter or scan a plate number first.</div>`;
    return;
  }
  try {
    const res = await fetch('/api/verify-and-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleNumber: plate, vehicleType: selectedType }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Unknown error');

    const cls = data.isSubscriber ? 'sub' : 'paid';
    resultBox.innerHTML = `<div class="result ${cls}">
      ${data.vehicleNumber} — ${data.isSubscriber ? `Subscriber (${data.subscriberName}) — Free entry` : `Charge: ₹${data.amount}`}
    </div>`;
    document.getElementById('plateInput').value = '';
    document.getElementById('ocrStatus').textContent = '';
  } catch (err) {
    resultBox.innerHTML = `<div class="result paid">Error: ${err.message}</div>`;
  }
}

// ---- Expense logging ----
async function submitExpense() {
  const amount = document.getElementById('expAmount').value;
  const description = document.getElementById('expDesc').value.trim();
  const expenseDate = document.getElementById('expDate').value;
  const resultEl = document.getElementById('expenseResult');

  if (!amount || !description || !expenseDate) {
    resultEl.innerHTML = `<div class="result paid">Please fill in amount, description, and date.</div>`;
    return;
  }
  try {
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: parseFloat(amount), description, expenseDate }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Unknown error');
    resultEl.innerHTML = `<div class="result sub">Expense logged: ₹${amount} — ${description}</div>`;
    document.getElementById('expAmount').value = '';
    document.getElementById('expDesc').value = '';
  } catch (err) {
    resultEl.innerHTML = `<div class="result paid">Error: ${err.message}</div>`;
  }
}

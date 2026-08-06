// server.js — starts the app: serves the frontend files AND the API
const express = require('express');
const path = require('path');
const apiRoutes = require('./routes/parking.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api', apiRoutes);
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Smart Parking System running on port ${PORT}`);
});

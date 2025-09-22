// dbService.js
// 🗄️ MongoDB operations

const mongoose = require('mongoose');

function connectDB() {
  return mongoose.connect(process.env.MONGO_URI);
}

module.exports = { connectDB };
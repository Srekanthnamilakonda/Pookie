const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  opponent: String,
  result: String, // "win" or "loss"
  timestamp: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  cookies: { type: Number, default: 0 },
  upgrades: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  matchHistory: [matchSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);

const mongoose = require('mongoose');

const battleRoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  players: [String], // Array of usernames
  ready: { type: Map, of: Boolean }, // who is ready
  scores: { type: Map, of: Number }, // click counts
  bets: { type: Map, of: Number }, // penguin bets
  status: { type: String, default: 'waiting' }, // waiting | ready | active | ended
  startTime: Date,
  endTime: Date
});

module.exports = mongoose.model('BattleRoom', battleRoomSchema);

const mongoose = require('mongoose');

const battleRoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  players: [String], // Array of usernames
  ready: {
    type: Map,
    of: Boolean,
    default: {},
  }, // Readiness of each player
  scores: {
    type: Map,
    of: Number,
    default: {},
  }, // Click scores of players
  bets: {
    type: Map,
    of: Number,
    default: {},
  }, // Penguin bets per player
  status: {
    type: String,
    enum: ['waiting', 'ready', 'active', 'ended'],
    default: 'waiting',
  }, // Room status
  startTime: Date,
  endTime: Date
});

module.exports = mongoose.model('BattleRoom', battleRoomSchema);

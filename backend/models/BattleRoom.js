const mongoose = require('mongoose');

const BattleRoomSchema = new mongoose.Schema({
  roomId: String,
  players: [String],
  ready: {
    type: Map,
    of: Boolean,
    default: {}
  },
  scores: {
    type: Map,
    of: Number,
    default: {}
  },
  status: {
    type: String,
    enum: ['waiting', 'ready', 'active', 'ended'],
    default: 'waiting'
  },
  startTime: Date,
  endTime: Date
});

module.exports = mongoose.model('BattleRoom', BattleRoomSchema);

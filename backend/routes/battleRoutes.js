const express = require('express');
const router = express.Router();
const BattleRoom = require('../models/BattleRoom');
const User = require('../models/User');

// Create battle room
router.post('/create', async (req, res) => {
  const { username } = req.body;
  const roomId = Math.random().toString(36).substring(2, 8); // short room ID

  const room = new BattleRoom({
    roomId,
    players: [username],
    ready: { [username]: false },
    scores: { [username]: 0 }
  });

  await room.save();
  res.json({ roomId });
});

// Join battle room
router.post('/join', async (req, res) => {
  const { roomId, username } = req.body;
  const room = await BattleRoom.findOne({ roomId });

  if (!room || room.players.length >= 2 || room.players.includes(username)) {
    return res.status(400).json({ error: 'Cannot join room' });
  }

  room.players.push(username);
  room.ready.set(username, false);
  room.scores.set(username, 0);
  await room.save();

  res.json({ success: true });
});

// Set ready status
router.post('/ready', async (req, res) => {
  const { roomId, username } = req.body;
  const room = await BattleRoom.findOne({ roomId });
  if (!room) return res.status(404).json({ error: 'Room not found' });

  room.ready.set(username, true);

  // Check if all players are ready
  const allReady = room.players.length === 2 && room.players.every(p => room.ready.get(p));
  if (allReady) {
    room.status = 'active';
    room.startTime = new Date();
    room.endTime = new Date(Date.now() + 15000); // 15s
  }

  await room.save();
  res.json({ status: room.status, startTime: room.startTime });
});

// Click during battle
router.post('/click', async (req, res) => {
  const { roomId, username } = req.body;
  const room = await BattleRoom.findOne({ roomId });
  if (!room || room.status !== 'active') return res.status(400).json({ error: 'Not in active battle' });

  const now = new Date();
  if (now > room.endTime) return res.status(400).json({ error: 'Battle ended' });

  room.scores.set(username, (room.scores.get(username) || 0) + 1);
  await room.save();
  res.json({ score: room.scores.get(username) });
});

// Get battle status (polling)
router.get('/status/:roomId', async (req, res) => {
  const room = await BattleRoom.findOne({ roomId: req.params.roomId });
  if (!room) return res.status(404).json({ error: 'Room not found' });

  res.json({
    players: room.players,
    ready: Object.fromEntries(room.ready),
    scores: Object.fromEntries(room.scores),
    status: room.status,
    startTime: room.startTime,
    endTime: room.endTime
  });
});

// Complete battle and update user stats
router.post('/complete', async (req, res) => {
  const { roomId } = req.body;
  const room = await BattleRoom.findOne({ roomId });
  if (!room || room.status !== 'active') return res.status(400).json({ error: 'Room not active' });

  const now = new Date();
  if (now < room.endTime) return res.status(400).json({ error: 'Battle not finished yet' });

  room.status = 'ended';
  await room.save();

  const [p1, p2] = room.players;
  const s1 = room.scores.get(p1);
  const s2 = room.scores.get(p2);

  const winner = s1 > s2 ? p1 : s2 > s1 ? p2 : null;
  const loser = winner === p1 ? p2 : winner === p2 ? p1 : null;

  if (winner && loser) {
    await User.updateOne({ username: winner }, {
      $inc: { wins: 1 },
      $push: { matchHistory: { opponent: loser, result: 'win' } }
    });
    await User.updateOne({ username: loser }, {
      $inc: { losses: 1 },
      $push: { matchHistory: { opponent: winner, result: 'loss' } }
    });
  }

  res.json({ winner, scores: Object.fromEntries(room.scores) });
});

module.exports = router;

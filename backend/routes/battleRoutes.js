
const express = require('express');
const router = express.Router();
const BattleRoom = require('../models/BattleRoom');
const User = require('../models/User');

// Create battle room with a bet
router.post('/create', async (req, res) => {
  const { username, bet } = req.body;
  const betAmount = bet * 10;

  const user = await User.findOne({ username });
  if (!user || user.cookies < betAmount) {
    return res.status(400).json({ error: 'Not enough cookies to bet that amount.' });
  }

  const roomId = Math.random().toString(36).substring(2, 8);

  const room = new BattleRoom({
    roomId,
    players: [username],
    ready: { [username]: false },
    scores: { [username]: 0 },
    bets: { [username]: bet }
  });

  user.cookies -= betAmount;
  await user.save();
  await room.save();

  res.json({ roomId });
});

// Join existing room with a bet
router.post('/join', async (req, res) => {
  const { roomId, username, bet } = req.body;
  const room = await BattleRoom.findOne({ roomId });
  const betAmount = bet * 10;

  const user = await User.findOne({ username });
  if (!room || room.players.length >= 2 || room.players.includes(username)) {
    return res.status(400).json({ error: 'Cannot join room' });
  }

  if (!user || user.cookies < betAmount) {
    return res.status(400).json({ error: 'Not enough cookies to bet that amount.' });
  }

  room.players.push(username);
  room.ready.set(username, false);
  room.scores.set(username, 0);
  room.bets.set(username, bet);

  user.cookies -= betAmount;
  await user.save();
  await room.save();

  res.json({ success: true });
});

// Set ready status
router.post('/ready', async (req, res) => {
  const { roomId, username } = req.body;
  const room = await BattleRoom.findOne({ roomId });
  if (!room) return res.status(404).json({ error: 'Room not found' });

  room.ready.set(username, true);

  const allReady = room.players.length === 2 && room.players.every(p => room.ready.get(p));
  if (allReady) {
    room.status = 'active';
    room.startTime = new Date();
    room.endTime = new Date(Date.now() + 15000);
  }

  await room.save();
  res.json({ status: room.status, startTime: room.startTime });
});

// Click handler
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

// Poll status
router.get('/status/:roomId', async (req, res) => {
  const room = await BattleRoom.findOne({ roomId: req.params.roomId });
  if (!room) return res.status(404).json({ error: 'Room not found' });

  res.json({
    players: room.players,
    ready: Object.fromEntries(room.ready),
    scores: Object.fromEntries(room.scores),
    bets: Object.fromEntries(room.bets || {}),
    status: room.status,
    startTime: room.startTime,
    endTime: room.endTime
  });
});

// Complete battle
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
  const b1 = room.bets.get(p1) || 0;
  const b2 = room.bets.get(p2) || 0;

  const winner = s1 > s2 ? p1 : s2 > s1 ? p2 : null;
  const loser = winner === p1 ? p2 : winner === p2 ? p1 : null;

  if (winner && loser) {
    const totalReward = (b1 + b2) * 10;

    await User.updateOne({ username: winner }, {
      $inc: { cookies: totalReward, wins: 1 },
      $push: { matchHistory: { opponent: loser, result: 'win' } }
    });

    await User.updateOne({ username: loser }, {
      $inc: { losses: 1 },
      $push: { matchHistory: { opponent: winner, result: 'loss' } }
    });
  }

  res.json({
    winner,
    scores: Object.fromEntries(room.scores),
    bets: Object.fromEntries(room.bets)
  });
});

module.exports = router;

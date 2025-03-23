const express = require('express');
const router = express.Router();
const BattleRoom = require('../models/BattleRoom');
const User = require('../models/User');

// Create battle room
router.post('/create', async (req, res) => {
  const { username } = req.body;
  const roomId = Math.random().toString(36).substring(2, 8);

  const room = new BattleRoom({
    roomId,
    players: [username],
    ready: { [username]: false },
    scores: { [username]: 0 },
    bets: { [username]: 0 }
  });

  await room.save();
  res.json({ roomId });
});

// Join existing room
router.post('/join', async (req, res) => {
  const { roomId, username } = req.body;
  const room = await BattleRoom.findOne({ roomId });

  if (!room) return res.status(400).json({ error: 'Room not found' });
  if (room.players.includes(username)) return res.status(400).json({ error: 'User already in room' });
  if (room.players.length >= 2) return res.status(400).json({ error: 'Room is full' });

  room.players.push(username);
  room.ready.set(username, false);
  room.scores.set(username, 0);
  room.bets.set(username, 0);
  await room.save();

  res.json({ success: true });
});

// Mark player ready & submit bet
router.post('/ready', async (req, res) => {
  const { roomId, username, bet } = req.body;
  const room = await BattleRoom.findOne({ roomId });
  const user = await User.findOne({ username });

  if (!room || !user) return res.status(404).json({ error: 'Room or user not found' });

  const cookieCost = (bet || 0) * 10;
  if (user.cookies < cookieCost) {
    return res.status(400).json({ error: 'Not enough cookies to bet!' });
  }

  room.ready.set(username, true);
  room.bets.set(username, bet || 0);

  const allReady = room.players.length === 2 && room.players.every(p => room.ready.get(p));
  if (allReady) {
    room.status = 'active';
    room.startTime = new Date();
    room.endTime = new Date(Date.now() + 15000); // 15 seconds
  }

  await room.save();
  res.json({ status: room.status });
});

// Clicking logic
router.post('/click', async (req, res) => {
  const { roomId, username } = req.body;
  const room = await BattleRoom.findOne({ roomId });
  if (!room || room.status !== 'active') return res.status(400).json({ error: 'Battle inactive' });

  const now = new Date();
  if (now > room.endTime) return res.status(400).json({ error: 'Battle ended' });

  room.scores.set(username, (room.scores.get(username) || 0) + 1);
  await room.save();
  res.json({ score: room.scores.get(username) });
});

// Status polling
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

// Complete and score battle
router.post('/complete', async (req, res) => {
  const { roomId } = req.body;
  const room = await BattleRoom.findOne({ roomId });
  if (!room || room.status !== 'active') return res.status(400).json({ error: 'Not active' });

  const now = new Date();
  if (now < room.endTime) return res.status(400).json({ error: 'Too early' });

  room.status = 'ended';
  await room.save();

  const [p1, p2] = room.players;
  const s1 = room.scores.get(p1);
  const s2 = room.scores.get(p2);
  const b1 = room.bets.get(p1) || 0;
  const b2 = room.bets.get(p2) || 0;
  const cookiePool = (b1 + b2) * 10;

  let winner = null;
  let loser = null;

  if (s1 > s2) {
    winner = p1;
    loser = p2;
  } else if (s2 > s1) {
    winner = p2;
    loser = p1;
  }

  if (winner && loser) {
    await User.updateOne({ username: winner }, {
      $inc: { cookies: cookiePool, wins: 1 },
      $push: { matchHistory: { opponent: loser, result: 'win' } }
    });

    await User.updateOne({ username: loser }, {
      $inc: { cookies: -((room.bets.get(loser) || 0) * 10), losses: 1 },
      $push: { matchHistory: { opponent: winner, result: 'loss' } }
    });
  } else {
    // Handle tie: no cookie reward/penalty, just record
    await User.updateOne({ username: p1 }, {
      $push: { matchHistory: { opponent: p2, result: 'tie' } }
    });
    await User.updateOne({ username: p2 }, {
      $push: { matchHistory: { opponent: p1, result: 'tie' } }
    });
  }

  res.json({
    winner,
    scores: Object.fromEntries(room.scores),
    bets: Object.fromEntries(room.bets)
  });
});

module.exports = router;

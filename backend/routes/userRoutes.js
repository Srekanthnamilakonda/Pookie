const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Leaderboard
router.get('/leaderboard', async (req, res) => {
  const users = await User.find().sort({ cookies: -1 }).limit(10);
  res.json(users);
});

// Get or create user
router.get('/:username', async (req, res) => {
  let user = await User.findOne({ username: req.params.username });
  if (!user) {
    user = new User({ username: req.params.username });
    await user.save();
  }
  res.json(user);
});

// Update username
router.post('/update-username', async (req, res) => {
  const { currentUsername, newUsername } = req.body;

  if (!newUsername || newUsername.trim() === '') {
    return res.status(400).json({ error: 'New username cannot be empty' });
  }

  const existingUser = await User.findOne({ username: newUsername });
  if (existingUser) {
    return res.status(409).json({ error: 'Username already taken' });
  }

  const user = await User.findOne({ username: currentUsername });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.username = newUsername;
  await user.save();

  res.json(user);
});


// Click update
router.post('/click', async (req, res) => {
  const { username } = req.body;
  const user = await User.findOne({ username });

  const clickValue = 1 + user.upgrades; // base 1 + upgrade bonus
  user.cookies += clickValue;

  await user.save();
  res.json(user);
});


// Buy upgrade
router.post('/upgrade', async (req, res) => {
  const { username } = req.body;
  const user = await User.findOne({ username });
  const cost = 10 * (user.upgrades + 1);
  if (user.cookies >= cost) {
    user.cookies -= cost;
    user.upgrades += 1;
    await user.save();
  }
  res.json(user);
});

// Add match result
router.post('/match', async (req, res) => {
  const { username, opponent, result } = req.body;
  const user = await User.findOne({ username });
  user.matchHistory.push({ opponent, result });
  if (result === 'win') user.wins++;
  else user.losses++;
  await user.save();
  res.json(user);
});



module.exports = router;

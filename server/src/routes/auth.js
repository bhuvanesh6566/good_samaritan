const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = new express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, phone, password, role, lat, lng } = req.body;
    
    let location;
    if (lat && lng) {
      location = { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] };
    }

    const user = new User({ name, phone, password, role, location });
    await user.save();
    
    const token = jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET);
    res.status(201).json({ user, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ error: 'Unable to login' });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Unable to login' });
    }

    const token = jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET);
    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', auth, async (req, res) => {
  const user = req.user.toObject ? req.user.toObject() : req.user;
  delete user.password;
  res.json(user);
});

module.exports = router;

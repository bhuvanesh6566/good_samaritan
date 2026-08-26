const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = new express.Router();

router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 2000 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const nearbyVolunteers = await User.find({
      role: 'volunteer',
      isActive: true,
      location: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius)
        }
      }
    }).limit(20);

    const formattedVolunteers = nearbyVolunteers.map(vol => {
      const phoneStr = vol.phone.toString();
      const maskedPhone = '****' + phoneStr.slice(-4);
      return {
        _id: vol._id,
        name: vol.name,
        phone: maskedPhone,
        volunteerId: vol.volunteerId,
        // Approximate distance could be calculated, just returning basics for now
        distance: 'Nearby'
      };
    });

    res.json(formattedVolunteers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/location', auth, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    req.user.location = {
      type: 'Point',
      coordinates: [parseFloat(lng), parseFloat(lat)]
    };
    
    await req.user.save();
    res.json(req.user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

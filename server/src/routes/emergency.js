const express = require('express');
const Emergency = require('../models/Emergency');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = new express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const { lat, lng, severity, imageBase64, notes } = req.body;
    const normalizedSeverity = (severity || 'high').toLowerCase();
    
    const parsedLat = parseFloat(lat) || 0;
    const parsedLng = parseFloat(lng) || 0;

    const emergency = new Emergency({
      reporterId: req.user._id,
      reporterName: req.user.name,
      location: { type: 'Point', coordinates: [parsedLng, parsedLat] },
      severity: normalizedSeverity,
      imageBase64: imageBase64 || '',
      notes: notes || ''
    });
    
    await emergency.save();

    let nearbyCount = 0;
    try {
      const nearbyVolunteers = await User.find({
        role: 'volunteer',
        isActive: true,
        location: {
          $nearSphere: {
            $geometry: { type: 'Point', coordinates: [parsedLng, parsedLat] },
            $maxDistance: 2000 // 2km in meters
          }
        }
      }).limit(20);
      nearbyCount = nearbyVolunteers.length;
    } catch (geoErr) {
      console.warn('Geospatial query warning:', geoErr.message);
    }

    const io = req.app.get('io');
    if (io) {
      const payload = {
        emergencyId: emergency._id,
        lat: parsedLat,
        lng: parsedLng,
        severity: normalizedSeverity,
        imageBase64: imageBase64 || '',
        notes: notes || '',
        reporterName: req.user.name || 'Citizen',
        timestamp: emergency.timestamp,
        nearbyCount: nearbyCount
      };
      io.to('volunteers').emit('emergency:new', payload);
      io.emit('emergency:new', payload); // Global fallback
      console.log(`[Emergency] Broadcasted emergency:new ${emergency._id}`);
    }

    res.status(201).json({ ...emergency.toObject(), emergencyId: emergency._id });
  } catch (error) {
    console.error('Emergency creation error:', error);
    res.status(400).json({ error: error.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const emergencies = await Emergency.find({ status: 'active' }).sort({ timestamp: -1 }).limit(20);
    res.json(emergencies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.id);
    if (!emergency) {
      return res.status(404).json({ error: 'Emergency not found' });
    }
    res.json(emergency);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/respond', auth, async (req, res) => {
  try {
    const responder = req.user;

    const emergency = await Emergency.findByIdAndUpdate(
      req.params.id, 
      { status: 'responding', responderId: responder._id, responderName: responder.name }, 
      { new: true }
    );
    
    if (!emergency) {
      return res.status(404).json({ error: 'Emergency not found' });
    }

    const io = req.app.get('io');
    io.to(`emergency:${emergency._id}`).emit('volunteer:accepted', { 
      volunteerName: responder.name, 
      volunteerPhone: responder.phone ? responder.phone.slice(-4).padStart(10, '*') : '****',
      eta: '~5 mins'
    });
    
    res.json(emergency);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/:id/resolve', auth, async (req, res) => {
  try {
    const emergency = await Emergency.findByIdAndUpdate(
      req.params.id, 
      { status: 'resolved', resolvedAt: Date.now() }, 
      { new: true }
    );
    
    if (!emergency) {
      return res.status(404).json({ error: 'Emergency not found' });
    }

    const io = req.app.get('io');
    io.to(`emergency:${emergency._id}`).emit('emergency:resolved', { emergencyId: emergency._id });
    
    res.json(emergency);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

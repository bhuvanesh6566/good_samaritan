const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema({
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reporterName: { type: String },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  severity: { type: String, enum: ['low', 'medium', 'high', 'Low', 'Medium', 'High'], default: 'high' },
  imageBase64: { type: String, default: '' },
  notes: { type: String, default: '' },
  status: { type: String, enum: ['active', 'responding', 'resolved'], default: 'active' },
  responderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  responderName: { type: String },
  timestamp: { type: Date, default: Date.now },
  resolvedAt: { type: Date }
});

emergencySchema.index({ location: '2dsphere' });

const Emergency = mongoose.model('Emergency', emergencySchema);
module.exports = Emergency;

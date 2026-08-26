const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { createServer } = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const emergencyRoutes = require('./routes/emergency');
const aiRoutes = require('./routes/ai');
const volunteerRoutes = require('./routes/volunteers');
const setupSocketHandlers = require('./socket/handlers');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' })); // allow base64 image payloads

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.set('io', io);
setupSocketHandlers(io);

app.use('/api/auth', authRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/volunteers', volunteerRoutes);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    const maskedUri = process.env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@');
    console.log(`MongoDB Connected: ${maskedUri}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    setTimeout(connectDB, 5000);
  }
};

connectDB();

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Groq API Key status: ${process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'PASTE_YOUR_GROQ_KEY_HERE' ? 'Configured' : 'Not Configured'}`);
});

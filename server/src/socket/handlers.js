module.exports = function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // Volunteer joins the alerts broadcast room
    socket.on('join:volunteers', () => {
      socket.join('volunteers');
      console.log(`[Socket] ${socket.id} joined volunteers room`);
    });

    // Both reporter AND volunteer join the emergency-specific room
    // Reporter joins after submitting → receives volunteer:accepted, location:update
    // Volunteer joins after accepting → receives reporter's location:update
    socket.on('join:emergency', ({ emergencyId }) => {
      if (!emergencyId) return;
      socket.join(`emergency:${emergencyId}`);
      console.log(`[Socket] ${socket.id} joined emergency:${emergencyId}`);
    });

    // Volunteer accepts → notify everyone in the emergency room (reporter sees "help coming")
    socket.on('volunteer:accept', ({ emergencyId, volunteerName }) => {
      if (!emergencyId) return;
      io.to(`emergency:${emergencyId}`).emit('volunteer:accepted', {
        volunteerName,
        emergencyId,
        eta: '~5 mins'
      });
      console.log(`[Socket] Volunteer ${volunteerName} accepted emergency:${emergencyId}`);
    });

    // Real-time location update
    // Emitted by: reporter (streams their GPS after submitting)
    //             volunteer (streams their GPS after accepting)
    // Forwarded to: everyone ELSE in the emergency room
    socket.on('location:update', ({ lat, lng, emergencyId, volunteerName }) => {
      if (!emergencyId || lat == null || lng == null) return;
      // socket.to() sends to all in room EXCEPT sender → avoids echo
      socket.to(`emergency:${emergencyId}`).emit('location:update', {
        lat,
        lng,
        volunteerName: volunteerName || null,
        socketId: socket.id
      });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });
};

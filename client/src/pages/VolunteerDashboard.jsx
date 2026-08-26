import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';
import AlertCard from '../components/AlertCard';
import EmergencyMap from '../components/EmergencyMap';
import { MapPin, Navigation, CheckCircle, Activity, Settings, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Beep sound for incoming emergency alert using Web Audio API
function playAlertBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.setValueAtTime(440, ctx.currentTime + 0.15); // A4
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3); // A5
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.warn('Audio play error:', e);
  }
}

export default function VolunteerDashboard() {
  const [isActive, setIsActive] = useState(true); // Default to ON DUTY
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [activeAlert, setActiveAlert] = useState(null);
  const [currentTask, setCurrentTask] = useState(null);
  const [activeIncidents, setActiveIncidents] = useState([]);
  const [loadingIncidents, setLoadingIncidents] = useState(false);

  // Reporter's live location — updated via socket 'location:update'
  const [reporterLocation, setReporterLocation] = useState(null);

  const watchIdRef = useRef(null);
  const isActiveRef = useRef(isActive);
  const currentTaskRef = useRef(currentTask);

  const { socket, isConnected } = useSocket();
  const { user } = useAuth();

  // Keep refs in sync with state to prevent stale closure bugs
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    currentTaskRef.current = currentTask;
  }, [currentTask]);

  // ── Fetch active emergencies from DB ───────────────────────
  const fetchActiveIncidents = useCallback(async () => {
    try {
      setLoadingIncidents(true);
      const res = await axios.get('/api/emergency');
      const data = Array.isArray(res.data) ? res.data : [];
      setActiveIncidents(data);
    } catch (err) {
      console.warn('Could not fetch active incidents:', err.message);
    } finally {
      setLoadingIncidents(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveIncidents();
    const interval = setInterval(fetchActiveIncidents, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [fetchActiveIncidents]);

  // ── Join volunteers socket room ────────────────────────────
  useEffect(() => {
    if (socket) {
      socket.emit('join:volunteers');
      console.log('[VolunteerDashboard] Emitted join:volunteers');
    }
  }, [socket, isConnected]);

  // ── Get volunteer's own location when Active ──────────────
  useEffect(() => {
    if (isActive && navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocation(newLoc);
          // Emit volunteer's location to the emergency room
          if (socket && currentTaskRef.current?.emergencyId) {
            socket.emit('location:update', {
              lat: newLoc.lat,
              lng: newLoc.lng,
              emergencyId: currentTaskRef.current.emergencyId,
              volunteerName: user?.name
            });
          }
        },
        (err) => console.error('Location error:', err),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 8000 }
      );
    } else {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isActive, socket, user]);

  // ── Socket listeners ──────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    // Join room explicitly
    socket.emit('join:volunteers');

    // New emergency alert handler
    const handleNewEmergency = (data) => {
      console.log('[VolunteerDashboard] Received emergency:new:', data);
      playAlertBeep();
      fetchActiveIncidents(); // refresh incidents list

      // Show alert card if active and not already on another task
      if (isActiveRef.current && !currentTaskRef.current) {
        setActiveAlert(data);
      }
    };

    // Reporter's LIVE location handler
    const handleLocationUpdate = (data) => {
      if (data.lat && data.lng && currentTaskRef.current) {
        setReporterLocation({ lat: data.lat, lng: data.lng });
      }
    };

    // Emergency resolved handler
    const handleEmergencyResolved = (data) => {
      if (currentTaskRef.current?.emergencyId === data.emergencyId) {
        setCurrentTask(null);
        setReporterLocation(null);
        alert('✅ Emergency resolved. Thank you for helping!');
      }
      fetchActiveIncidents();
    };

    socket.on('emergency:new', handleNewEmergency);
    socket.on('location:update', handleLocationUpdate);
    socket.on('emergency:resolved', handleEmergencyResolved);

    return () => {
      socket.off('emergency:new', handleNewEmergency);
      socket.off('location:update', handleLocationUpdate);
      socket.off('emergency:resolved', handleEmergencyResolved);
    };
  }, [socket, fetchActiveIncidents]);

  // ── Accept emergency ──────────────────────────────────────
  const handleAccept = async (alertData) => {
    try {
      const eid = alertData.emergencyId || alertData._id;
      await axios.patch(`/api/emergency/${eid}/respond`);

      if (socket) {
        // Join the emergency room to receive reporter's live location
        socket.emit('join:emergency', { emergencyId: eid });
        socket.emit('volunteer:accept', {
          emergencyId: eid,
          volunteerId: user?._id,
          volunteerName: user?.name
        });
      }

      // Set initial reporter location from alert data
      const repLat = alertData.lat || alertData.location?.coordinates?.[1];
      const repLng = alertData.lng || alertData.location?.coordinates?.[0];
      if (repLat && repLng) {
        setReporterLocation({ lat: repLat, lng: repLng });
      }

      setCurrentTask({ ...alertData, emergencyId: eid });
      setActiveAlert(null);
      fetchActiveIncidents();
    } catch (err) {
      console.error(err);
      alert('Could not accept — someone else may have taken it.');
      setActiveAlert(null);
    }
  };

  // ── Resolve / hand over ───────────────────────────────────
  const handleResolve = async () => {
    if (!currentTask) return;
    if (window.confirm('Mark this emergency as handed over to medical team?')) {
      try {
        await axios.patch(`/api/emergency/${currentTask.emergencyId}/resolve`);
        setCurrentTask(null);
        setReporterLocation(null);
        fetchActiveIncidents();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="flex-1 bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-gray-900">🛡️ Responder Dashboard</h1>
              {isConnected ? (
                <span className="bg-green-100 text-green-700 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  🟢 Live Connected
                </span>
              ) : (
                <span className="bg-amber-100 text-amber-700 text-xs px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                  🟡 Reconnecting...
                </span>
              )}
            </div>
            <p className="text-gray-500 flex items-center gap-1 mt-1 text-sm">
              <MapPin size={14} />
              {location.lat
                ? `Your location: ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
                : isActive ? 'Acquiring GPS location...' : 'Toggle ON DUTY to start'
              }
            </p>
          </div>

          <div className="flex items-center gap-3 bg-gray-100 px-4 py-2 rounded-xl">
            <span className={`font-bold text-sm ${isActive ? 'text-green-600' : 'text-gray-400'}`}>
              {isActive ? '🟢 ON DUTY' : '⚫ OFF DUTY'}
            </span>
            <button
              onClick={() => setIsActive(prev => !prev)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* ── Active Deployment ── */}
        {currentTask ? (
          <div className="space-y-4">
            {/* Task banner */}
            <div className="bg-red-600 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Activity size={120} /></div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 bg-red-700 px-3 py-1 rounded-full text-sm font-bold mb-3">
                  <span className="w-2 h-2 bg-white rounded-full animate-ping inline-block" />
                  ACTIVE DEPLOYMENT
                </div>
                <h2 className="text-2xl font-black mb-1">Proceed to Accident Scene</h2>
                <p className="text-red-100 text-sm mb-5">
                  Reported by: <strong>{currentTask.reporterName || 'Anonymous'}</strong>
                  {currentTask.severity && <> &nbsp;·&nbsp; Severity: <strong className="uppercase">{currentTask.severity}</strong></>}
                  {currentTask.notes && <> &nbsp;·&nbsp; Notes: <em>"{currentTask.notes}"</em></>}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${reporterLocation?.lat ?? currentTask.lat},${reporterLocation?.lng ?? currentTask.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-white text-red-600 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition"
                  >
                    <Navigation size={18} /> Navigate (Google Maps)
                  </a>
                  <button
                    onClick={handleResolve}
                    className="bg-red-700 text-white border border-red-500 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-800 transition"
                  >
                    <CheckCircle size={18} /> Mark Handed Over
                  </button>
                </div>
              </div>
            </div>

            {/* Live location tracker */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-3 h-3 bg-red-500 rounded-full animate-ping inline-block" />
                <h3 className="font-bold text-gray-900">Reporter's Live Location</h3>
                {reporterLocation && (
                  <span className="ml-auto text-xs text-gray-400 font-mono">
                    {reporterLocation.lat.toFixed(5)}, {reporterLocation.lng.toFixed(5)}
                  </span>
                )}
              </div>

              {reporterLocation ? (
                <EmergencyMap
                  lat={reporterLocation.lat}
                  lng={reporterLocation.lng}
                  emergencyId={currentTask.emergencyId}
                  volunteersNearby={
                    location.lat
                      ? [{ name: `You (${user?.name || 'Volunteer'})`, lat: location.lat, lng: location.lng }]
                      : []
                  }
                />
              ) : (
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl text-gray-400 text-sm border-2 border-dashed border-gray-200">
                  <span className="animate-pulse">Waiting for reporter's location...</span>
                </div>
              )}

              <p className="text-xs text-gray-400 mt-2 text-center">
                🔴 Red marker = accident victim &nbsp;|&nbsp; 🟢 Green marker = you
              </p>
            </div>

            {/* Shield reminder */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <ShieldCheck size={24} className="text-green-600 flex-shrink-0" />
              <p className="text-green-800 text-sm font-medium">
                You are protected under India's <strong>Good Samaritan Law (2016)</strong>.
                You cannot be detained or held liable for helping.
              </p>
            </div>
          </div>

        ) : (
          // ── Standby view ──
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" style={{ height: '420px' }}>
                {location.lat ? (
                  <EmergencyMap
                    lat={location.lat}
                    lng={location.lng}
                    volunteersNearby={[{ name: `📍 You (${user?.name})`, lat: location.lat, lng: location.lng }]}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-50 text-gray-400 flex-col gap-3">
                    <MapPin size={40} className="opacity-30" />
                    <p className="text-sm">{isActive ? 'Acquiring your location...' : 'Toggle ON DUTY to see your position'}</p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Activity size={18} className="text-orange-500" /> Area Status
                  </h3>
                  {isActive ? (
                    <div className="flex flex-col items-center justify-center text-center px-2 py-4">
                      <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4 relative">
                        <div className="absolute inset-0 rounded-full bg-green-200 animate-ping opacity-30" />
                        <ShieldCheck size={36} className="text-green-600 relative z-10" />
                      </div>
                      <h4 className="font-bold text-gray-900 mb-2">Monitoring 2 km Radius</h4>
                      <p className="text-sm text-gray-500">You'll receive an instant alert if an accident is reported near you.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center px-2 py-4">
                      <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-4">
                        <Settings size={30} />
                      </div>
                      <h4 className="font-bold text-gray-900 mb-2">Currently Offline</h4>
                      <p className="text-sm text-gray-500">Toggle <strong>ON DUTY</strong> to start receiving emergency alerts.</p>
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl text-xs text-blue-800">
                  💡 <strong>Tip:</strong> Keep this tab open while on duty. Incoming alerts will trigger an audible sound and popup.
                </div>
              </div>
            </div>

            {/* ── Active Incidents Feed ── */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="text-red-600" size={22} />
                  <h3 className="font-black text-gray-900 text-lg">Active Emergency Reports</h3>
                  <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold">
                    {activeIncidents.length} Active
                  </span>
                </div>
                <button
                  onClick={fetchActiveIncidents}
                  disabled={loadingIncidents}
                  className="text-gray-500 hover:text-gray-900 flex items-center gap-1 text-sm font-medium transition"
                >
                  <RefreshCw size={14} className={loadingIncidents ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>

              {activeIncidents.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No active accident reports right now. All clear in your area! 🟢
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeIncidents.map((incident) => {
                    const lat = incident.location?.coordinates?.[1] || incident.lat;
                    const lng = incident.location?.coordinates?.[0] || incident.lng;
                    const sev = (incident.severity || 'high').toLowerCase();
                    const sevBadge = sev === 'high' ? 'bg-red-500 text-white' : sev === 'medium' ? 'bg-orange-500 text-white' : 'bg-yellow-500 text-white';

                    return (
                      <div
                        key={incident._id || incident.emergencyId}
                        className="border-2 border-red-200 hover:border-red-500 rounded-xl p-4 transition-all bg-red-50/30 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${sevBadge}`}>
                              {incident.severity || 'High'} Severity
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(incident.timestamp).toLocaleTimeString()}
                            </span>
                          </div>

                          <h4 className="font-bold text-gray-900 mb-1">
                            Accident reported by {incident.reporterName || 'Citizen'}
                          </h4>

                          {incident.notes && (
                            <p className="text-xs text-gray-600 mb-2 italic">
                              "{incident.notes}"
                            </p>
                          )}

                          {lat && lng && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin size={12} /> {lat.toFixed(4)}, {lng.toFixed(4)}
                            </p>
                          )}

                          {incident.imageBase64 && (
                            <img
                              src={incident.imageBase64}
                              alt="Accident Scene"
                              className="w-full h-24 object-cover rounded-lg mt-2 border border-gray-200"
                            />
                          )}
                        </div>

                        <button
                          onClick={() => handleAccept({ ...incident, emergencyId: incident._id, lat, lng })}
                          className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg text-sm transition shadow flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={16} /> Accept &amp; Respond
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Incoming alert popup modal ── */}
      {activeAlert && (
        <AlertCard
          alert={activeAlert}
          onAccept={handleAccept}
          onDismiss={() => setActiveAlert(null)}
        />
      )}
    </div>
  );
}

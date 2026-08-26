import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, AlertTriangle, CheckCircle, Camera, RotateCcw, MapPin, Edit2, RefreshCw } from 'lucide-react';
import axios from 'axios';
import AIVoiceGuide from '../components/AIVoiceGuide';
import EmergencyMap from '../components/EmergencyMap';

export default function Emergency() {
  const [phase, setPhase] = useState('READY'); // READY, LOCATING, ASSESSING, AI_GUIDE, DISPATCHED
  const [location, setLocation] = useState(null);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [customLat, setCustomLat] = useState('');
  const [customLng, setCustomLng] = useState('');
  const { user } = useAuth();
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [severity, setSeverity] = useState('High');
  const [notes, setNotes] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [emergencyId, setEmergencyId] = useState(null);
  const [volunteerInfo, setVolunteerInfo] = useState(null);
  const [volunteerLocation, setVolunteerLocation] = useState(null);

  // Camera states
  const [cameraOpen, setCameraOpen] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' = rear, 'user' = front
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Location watch ref
  const watchIdRef = useRef(null);

  const { socket } = useSocket();

  // ── Socket listeners ──────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    socket.on('volunteer:accepted', (data) => {
      setVolunteerInfo(data);
      setPhase('DISPATCHED');
    });

    // Volunteer's real-time location coming back to reporter
    socket.on('location:update', (data) => {
      if (data.lat && data.lng) {
        setVolunteerLocation({ lat: data.lat, lng: data.lng, name: data.volunteerName || 'Volunteer' });
      }
    });

    return () => {
      socket.off('volunteer:accepted');
      socket.off('location:update');
    };
  }, [socket]);

  // ── Reporter real-time location streaming ────────────────
  // Starts after emergency is submitted — continuously streams position to volunteer
  const startLocationStreaming = useCallback((eid) => {
    if (!navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLocation({ lat, lng }); // keep local state fresh too
        if (socket) {
          socket.emit('location:update', { lat, lng, emergencyId: eid });
        }
      },
      (err) => console.warn('Location watch error:', err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  }, [socket]);

  // Stop streaming when component unmounts
  useEffect(() => {
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      stopCamera();
    };
  }, []);

  // ── Multi-stage resilient location resolver ──────────────
  const getAccurateLocation = async () => {
    // 1. Try standard browser geolocation (low accuracy first for instant desktop/network resolution)
    if (navigator.geolocation) {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            () => {
              // Retry with non-strict timeout
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: false,
                timeout: 6000,
                maximumAge: 60000
              });
            },
            { enableHighAccuracy: false, timeout: 3500, maximumAge: 300000 }
          );
        });
        if (pos?.coords?.latitude && pos?.coords?.longitude) {
          return { lat: pos.coords.latitude, lng: pos.coords.longitude };
        }
      } catch (geoErr) {
        console.warn('Browser GPS unavailable, using fallback:', geoErr.message);
      }
    }

    // 2. Check if logged in user has registered coordinates
    const userLat = user?.location?.coordinates?.[1];
    const userLng = user?.location?.coordinates?.[0];
    if (userLat && userLng && (userLat !== 0 || userLng !== 0)) {
      return { lat: userLat, lng: userLng };
    }

    // 3. Try IP-based location estimation
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      if (data.latitude && data.longitude) {
        return { lat: data.latitude, lng: data.longitude };
      }
    } catch (ipErr) {
      console.warn('IP geolocation fallback failed:', ipErr.message);
    }

    // 4. Default coordinates (Chennai central emergency hub)
    return { lat: 13.0827, lng: 80.2707 };
  };

  const handleInitialClick = async () => {
    setPhase('LOCATING');
    try {
      const loc = await getAccurateLocation();
      setLocation(loc);
      setCustomLat(loc.lat.toFixed(5));
      setCustomLng(loc.lng.toFixed(5));
    } catch (e) {
      const defaultLoc = { lat: 13.0827, lng: 80.2707 };
      setLocation(defaultLoc);
      setCustomLat('13.0827');
      setCustomLng('80.2707');
    }
    setPhase('ASSESSING');
  };

  // ── Camera helpers ────────────────────────────────────────
  const openCamera = async () => {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      setCapturedPhoto(null);
      setCameraOpen(true);
    } catch (err) {
      alert('Camera access denied. Please allow camera permission or use photo upload.');
      console.error(err);
    }
  };

  // Attach stream whenever video element is mounted in DOM
  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(e => console.warn('Video playback error:', e));
    }
  }, [cameraOpen, facingMode]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const flipCamera = async () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: next },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn(e));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedPhoto(dataUrl);
    setImageBase64(dataUrl);
    stopCamera();
    setCameraOpen(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedPhoto(reader.result);
        setImageBase64(reader.result);
        stopCamera();
        setCameraOpen(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    setImageBase64('');
    openCamera();
  };

  // ── Submit emergency ──────────────────────────────────────
  const submitEmergency = async () => {
    setSubmitError('');
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/emergency', {
        lat: location.lat,
        lng: location.lng,
        severity,
        notes,
        imageBase64
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const eid = res.data.emergencyId || res.data._id;
      setEmergencyId(eid);
      if (socket) socket.emit('join:emergency', { emergencyId: eid });
      startLocationStreaming(eid);
      setPhase('AI_GUIDE');
    } catch (err) {
      console.error('Emergency submit error:', err);
      const msg = err.response?.data?.error
        || err.response?.data?.message
        || err.message
        || 'Unknown error';
      setSubmitError(`Error: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 pb-12">

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Good Samaritan Law Banner */}
      {phase !== 'READY' && phase !== 'LOCATING' && (
        <div className="bg-green-600 text-white p-3 flex items-center justify-center gap-2 text-sm font-bold shadow-md">
          <ShieldCheck size={20} />
          You are protected under India's Good Samaritan Law (2016)
        </div>
      )}

      <div className="flex-1 px-3 sm:px-4 py-6 sm:py-8 max-w-3xl mx-auto w-full flex flex-col justify-center">

        {/* ── READY ── */}
        {phase === 'READY' && (
          <div className="text-center flex flex-col items-center py-6 sm:py-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-2 sm:mb-4 tracking-tight">
              Witnessed a Road Accident?
            </h1>
            <p className="text-gray-400 mb-8 sm:mb-12 text-base sm:text-lg max-w-md px-2">
              One tap. No forms. Instant GPS broadcast to nearby responders.
            </p>
            <button
              onClick={handleInitialClick}
              className="w-52 h-52 sm:w-64 sm:h-64 bg-red-600 rounded-full flex flex-col items-center justify-center text-white shadow-2xl emergency-btn border-4 border-red-500 active:scale-95 transition"
            >
              <AlertTriangle size={52} className="mb-1 sm:mb-2" />
              <span className="text-2xl sm:text-3xl font-black">REPORT</span>
              <span className="text-2xl sm:text-3xl font-black uppercase tracking-widest mt-0.5">Accident</span>
            </button>
            <p className="text-gray-500 mt-8 sm:mt-12 text-xs sm:text-sm">
              Protected under India's Good Samaritan Law (2016)
            </p>
          </div>
        )}

        {/* ── LOCATING ── */}
        {phase === 'LOCATING' && (
          <div className="text-center flex flex-col items-center justify-center h-64">
            <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-6"></div>
            <h2 className="text-2xl font-bold text-white">Acquiring precise GPS location...</h2>
            <p className="text-gray-400 mt-2">Please ensure location services are enabled.</p>
          </div>
        )}

        {/* ── ASSESSING ── */}
        {phase === 'ASSESSING' && (
          <div className="bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-700 w-full">
            <h2 className="text-2xl font-bold text-white mb-2 border-b border-gray-700 pb-4">Quick Assessment</h2>

            {/* GPS confirmed & manual adjustment */}
            {location && (
              <div className="bg-gray-900/60 border border-gray-700 p-3.5 rounded-xl mb-6 mt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                    <MapPin size={16} className="text-green-400 flex-shrink-0" />
                    <span>Location: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingLocation(!isEditingLocation)}
                    className="text-xs text-gray-400 hover:text-white flex items-center gap-1 underline"
                  >
                    <Edit2 size={12} />
                    {isEditingLocation ? 'Done' : 'Change'}
                  </button>
                </div>

                {isEditingLocation && (
                  <div className="mt-3 pt-3 border-t border-gray-700 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-gray-400 block mb-1">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        value={customLat}
                        onChange={(e) => {
                          setCustomLat(e.target.value);
                          if (!isNaN(parseFloat(e.target.value))) {
                            setLocation(prev => ({ ...prev, lat: parseFloat(e.target.value) }));
                          }
                        }}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-white outline-none focus:border-red-500"
                        placeholder="13.0827"
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 block mb-1">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        value={customLng}
                        onChange={(e) => {
                          setCustomLng(e.target.value);
                          if (!isNaN(parseFloat(e.target.value))) {
                            setLocation(prev => ({ ...prev, lng: parseFloat(e.target.value) }));
                          }
                        }}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-white outline-none focus:border-red-500"
                        placeholder="80.2707"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Severity */}
            <div className="mb-6">
              <label className="block text-gray-300 font-medium mb-3">Severity</label>
              <div className="flex gap-3">
                {['High', 'Medium', 'Low'].map(s => (
                  <button
                    key={s}
                    onClick={() => setSeverity(s)}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition ${severity === s
                      ? s === 'High' ? 'bg-red-600 text-white'
                        : s === 'Medium' ? 'bg-orange-500 text-white'
                          : 'bg-yellow-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* ── CAMERA SECTION ── */}
            <div className="mb-6">
              <label className="block text-gray-300 font-medium mb-3">
                📷 Photo of Scene <span className="text-gray-500 text-sm">(Optional)</span>
              </label>

              {/* Camera viewfinder */}
              {cameraOpen && (
                <div className="relative w-full rounded-xl overflow-hidden bg-black mb-3">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full rounded-xl"
                    style={{ maxHeight: '260px', objectFit: 'cover' }}
                  />
                  {/* Flip camera button */}
                  <button
                    onClick={flipCamera}
                    className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full hover:bg-black/80"
                    title="Flip camera"
                  >
                    <RotateCcw size={18} />
                  </button>
                  {/* Capture button */}
                  <div className="flex justify-center pb-4 pt-2 bg-black/30">
                    <button
                      onClick={capturePhoto}
                      className="w-16 h-16 bg-white rounded-full border-4 border-red-500 shadow-lg hover:scale-105 transition flex items-center justify-center"
                    >
                      <div className="w-10 h-10 bg-red-600 rounded-full" />
                    </button>
                  </div>
                </div>
              )}

              {/* Captured photo preview */}
              {capturedPhoto && !cameraOpen && (
                <div className="relative w-full rounded-xl overflow-hidden mb-3">
                  <img src={capturedPhoto} alt="Captured" className="w-full rounded-xl max-h-60 object-cover" />
                  <button
                    onClick={retakePhoto}
                    className="absolute top-2 right-2 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-black/90"
                  >
                    <RotateCcw size={12} /> Retake
                  </button>
                  <div className="absolute bottom-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                    ✅ Photo captured
                  </div>
                </div>
              )}

              {/* Open camera or Upload buttons */}
              {!cameraOpen && !capturedPhoto && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={openCamera}
                    className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3.5 px-4 rounded-xl border-2 border-dashed border-gray-500 transition"
                  >
                    <Camera size={20} />
                    <span>Open Live Camera</span>
                  </button>

                  <label className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3.5 px-4 rounded-xl border-2 border-dashed border-gray-500 transition cursor-pointer">
                    <span>📁 Upload / Gallery</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="mb-8">
              <label className="block text-gray-300 font-medium mb-3">
                Additional Notes <span className="text-gray-500 text-sm">(Optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="E.g., 2 victims, car on fire, highway NH-44..."
                className="w-full bg-gray-700 text-white border-0 rounded-xl p-4 focus:ring-2 focus:ring-red-500 outline-none"
                rows="2"
              />
            </div>

            {submitError && (
              <div className="mb-6 bg-red-950/80 border border-red-500 text-red-200 p-4 rounded-xl text-sm flex items-start gap-2">
                <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <strong className="block text-white font-bold mb-1">Failed to send alert:</strong>
                  <span>{submitError}</span>
                  <div className="mt-2">
                    <a href="tel:112" className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition">
                      📞 Call 112 Directly
                    </a>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={submitEmergency}
              disabled={submitting}
              className="w-full bg-red-600 text-white py-4 rounded-xl font-black text-xl hover:bg-red-700 shadow-lg shadow-red-600/20 uppercase tracking-wide transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Broadcasting Alert...</span>
                </>
              ) : (
                <span>🚨 Send Alert &amp; Get Guidance</span>
              )}
            </button>
          </div>
        )}

        {/* ── AI GUIDE ── */}
        {phase === 'AI_GUIDE' && (
          <div className="w-full space-y-4">
            <div className="bg-orange-500/20 border border-orange-500 text-orange-400 p-4 rounded-xl flex items-start gap-3">
              <AlertTriangle className="flex-shrink-0 mt-1" size={20} />
              <div>
                <h4 className="font-bold">Alert broadcasted to nearby volunteers!</h4>
                <p className="text-sm opacity-90 mt-1">
                  Your live location is being shared. Please answer the AI guide below.
                </p>
              </div>
            </div>
            {/* Live location indicator */}
            <div className="flex items-center gap-2 text-green-400 text-sm bg-green-900/20 border border-green-800 px-4 py-2 rounded-xl">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block" />
              Live location sharing active — volunteer can track you in real time
            </div>
            <AIVoiceGuide emergencyId={emergencyId} />
          </div>
        )}

        {/* ── DISPATCHED ── */}
        {phase === 'DISPATCHED' && volunteerInfo && location && (
          <div className="w-full space-y-6">
            <div className="bg-green-600/20 border-2 border-green-500 text-white p-6 rounded-2xl text-center shadow-lg">
              <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
              <h2 className="text-3xl font-black text-white mb-2">Help is on the way!</h2>
              <p className="text-lg text-gray-300">
                Volunteer <strong className="text-white">{volunteerInfo.volunteerName}</strong> accepted and is navigating to you.
              </p>
              <p className="text-sm text-green-400 mt-2">ETA: {volunteerInfo.eta || '~5 mins'}</p>
            </div>

            {/* Live location indicator */}
            <div className="flex items-center gap-2 text-green-400 text-sm bg-green-900/20 border border-green-800 px-4 py-3 rounded-xl">
              <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse inline-block" />
              <span>Your live location is streaming to the volunteer</span>
            </div>

            <EmergencyMap
              lat={location.lat}
              lng={location.lng}
              emergencyId={emergencyId}
              volunteersNearby={volunteerLocation
                ? [{ name: volunteerInfo.volunteerName, lat: volunteerLocation.lat, lng: volunteerLocation.lng }]
                : []
              }
            />

            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">While you wait</h3>
              <ul className="list-disc pl-5 text-gray-300 space-y-2 text-sm">
                <li>Do NOT move the victim unless there is immediate danger (fire / explosion).</li>
                <li>Keep the victim warm and conscious — talk to them.</li>
                <li>Make yourself visible to oncoming traffic.</li>
                <li>Stay on the line with 112 if you have called them.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

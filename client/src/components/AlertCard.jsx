import { useEffect, useState } from 'react';
import { AlertCircle, Clock, User, CheckCircle, XCircle, MapPin } from 'lucide-react';

export default function AlertCard({ alert, onAccept, onDismiss }) {
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onDismiss]);

  const sev = (alert.severity || '').toLowerCase();
  const severityColor = sev === 'high' ? 'bg-red-600' : sev === 'medium' ? 'bg-orange-500' : 'bg-yellow-500';

  return (
    <div className="fixed inset-x-3 bottom-3 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-96 bg-white rounded-2xl shadow-2xl border-2 border-red-500 overflow-hidden z-50 animate-bounce-short">
      {/* Card Header */}
      <div className="bg-red-600 text-white px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2 font-black text-sm sm:text-base">
          <AlertCircle className="animate-bounce" size={20} />
          <span>🚨 ACCIDENT NEARBY!</span>
        </div>
        <div className="text-xs font-mono bg-red-800/90 text-red-100 px-2.5 py-1 rounded-full font-bold">
          00:{timeLeft.toString().padStart(2, '0')}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-gray-800 text-xs sm:text-sm">
            <User size={16} className="text-gray-400" />
            <span>Reporter: <strong>{alert.reporterName || 'Citizen'}</strong></span>
          </div>

          <span className={`text-[11px] text-white px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${severityColor}`}>
            {alert.severity || 'High'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-gray-500 text-xs">
          <Clock size={14} className="text-gray-400" />
          <span>{new Date(alert.timestamp || Date.now()).toLocaleTimeString()}</span>
        </div>

        {alert.notes && (
          <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded-lg border border-gray-100 italic">
            "{alert.notes}"
          </p>
        )}

        {alert.imageBase64 && (
          <div className="mt-1 rounded-xl overflow-hidden border border-gray-200">
            <img src={alert.imageBase64} alt="Accident scene" className="w-full h-28 object-cover" />
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 mt-2">
          <button
            onClick={() => onDismiss()}
            className="flex items-center justify-center gap-1.5 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50 active:scale-95 transition"
          >
            <XCircle size={18} />
            <span>Skip</span>
          </button>

          <button
            onClick={() => onAccept(alert)}
            className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black text-sm active:scale-95 transition shadow-lg shadow-green-600/30"
          >
            <CheckCircle size={18} />
            <span>RESPOND</span>
          </button>
        </div>
      </div>
    </div>
  );
}

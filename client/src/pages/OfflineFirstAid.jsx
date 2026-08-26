import { useState, useEffect } from 'react';
import { Heart, Activity, Scissors, UserCheck, AlertTriangle, WifiOff, ShieldCheck } from 'lucide-react';

const GUIDES = [
  {
    id: 'cpr',
    title: 'CPR (No Pulse / Breathing)',
    shortTitle: 'CPR',
    icon: <Activity size={20} />,
    color: 'bg-red-600',
    steps: [
      "Check scene safety. Tap the victim's shoulder and shout 'Are you okay?'",
      "If no response and no normal breathing, CALL 112 immediately.",
      "Place heel of one hand on center of chest, place other hand on top and interlace fingers.",
      "Push hard and fast: at least 2 inches deep, 100-120 pushes a minute (to the beat of 'Stayin Alive').",
      "Allow chest to return to normal position after each push.",
      "Do not stop until help arrives or victim shows signs of life."
    ],
    dont: "Don't stop chest compressions for more than 10 seconds."
  },
  {
    id: 'bleeding',
    title: 'Severe Bleeding Control',
    shortTitle: 'Bleeding',
    icon: <Scissors size={20} />,
    color: 'bg-orange-600',
    steps: [
      "Locate the exact source of bleeding.",
      "Cover the wound with a clean cloth, towel, or shirt.",
      "Press hard and continuously with both hands directly on the wound.",
      "If blood soaks through, do NOT remove the first cloth. Add more on top.",
      "Elevate the injured limb above heart level if possible and safe.",
      "Maintain continuous firm pressure until ambulance arrives."
    ],
    dont: "Don't remove any impaled objects stuck in the wound — apply pressure around them."
  },
  {
    id: 'recovery',
    title: 'Recovery Position',
    shortTitle: 'Recovery',
    icon: <UserCheck size={20} />,
    color: 'bg-blue-600',
    steps: [
      "Use only if victim is UNCONSCIOUS but BREATHING normally.",
      "Kneel beside the victim. Straighten their legs.",
      "Place the arm nearest you out at a right angle to their body.",
      "Bring the far arm across their chest, placing the back of their hand against their nearest cheek.",
      "With your other hand, pull the far knee up to a right angle.",
      "Roll the victim gently toward you onto their side to keep airway open."
    ],
    dont: "Don't move victim if head/neck/spine injury is suspected, unless they are choking on vomit."
  }
];

export default function OfflineFirstAid() {
  const [activeGuide, setActiveGuide] = useState(GUIDES[0]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="flex-1 bg-gray-50 flex flex-col pb-12">
      {/* Offline indicator bar */}
      {isOffline && (
        <div className="bg-gray-900 text-amber-300 px-4 py-2 text-center text-xs sm:text-sm font-bold flex items-center justify-center gap-2">
          <WifiOff size={16} />
          <span>Offline Mode Active — First aid guides are stored directly on your device.</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex-1">
        {/* Title */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center justify-center gap-2">
            <Heart className="text-red-600" size={30} />
            <span>Offline First-Aid Manual</span>
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            Works 100% offline without internet. Safe and legal to assist.
          </p>
        </div>

        {/* Scrollable Tab Bar for Mobile */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {GUIDES.map(guide => {
            const isSelected = activeGuide.id === guide.id;
            return (
              <button
                key={guide.id}
                onClick={() => setActiveGuide(guide)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm ${
                  isSelected
                    ? `${guide.color} text-white shadow-md scale-[1.02]`
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {guide.icon}
                <span>{guide.title}</span>
              </button>
            );
          })}
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className={`${activeGuide.color} p-5 sm:p-6 text-white`}>
            <div className="flex items-center gap-2 text-white/80 text-xs uppercase font-bold tracking-wider mb-1">
              <span>Emergency Step-by-Step Guide</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">{activeGuide.title}</h2>
          </div>

          <div className="p-5 sm:p-8 space-y-6">
            {/* Steps */}
            <div>
              <h3 className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-wider mb-4">
                What to do right now
              </h3>
              <div className="space-y-4">
                {activeGuide.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3 sm:gap-4">
                    <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full ${activeGuide.color} text-white flex items-center justify-center font-black text-xs sm:text-sm mt-0.5`}>
                      {i + 1}
                    </div>
                    <p className="text-gray-800 text-sm sm:text-base leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Critical Don't */}
            <div className="bg-red-50 p-4 sm:p-5 rounded-xl border border-red-100 flex items-start gap-3">
              <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={22} />
              <div>
                <h4 className="font-black text-red-900 uppercase tracking-wider text-xs mb-0.5">
                  Critical Warning / DO NOT
                </h4>
                <p className="text-red-800 text-xs sm:text-sm font-medium leading-relaxed">
                  {activeGuide.dont}
                </p>
              </div>
            </div>

            {/* Shield Reminder */}
            <div className="bg-green-50 p-3.5 rounded-xl border border-green-200 flex items-center gap-2 text-xs text-green-900 font-medium">
              <ShieldCheck size={18} className="text-green-600 flex-shrink-0" />
              <span>You are protected under India's Good Samaritan Law (2016) while rendering first aid.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

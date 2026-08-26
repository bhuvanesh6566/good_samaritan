import { Link } from 'react-router-dom';
import { Shield, Zap, Phone, Users, Mic, BookOpen, ChevronRight, Heart, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Hero Section ── */}
      <section className="bg-gradient-to-b from-red-50/80 via-white to-white py-12 sm:py-16 md:py-24 px-4 sm:px-6 lg:px-8 text-center flex flex-col justify-center items-center">
        <div className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs sm:text-sm font-bold mb-4">
          <span className="w-2 h-2 bg-red-600 rounded-full animate-ping inline-block" />
          <span>India Road Safety Hackathon MVP</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-gray-900 mb-4 sm:mb-6 tracking-tight leading-tight">
          Every Second Counts.<br />
          <span className="text-red-600">Be The Help.</span>
        </h1>

        <p className="text-base sm:text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto mb-8 sm:mb-10 font-medium px-2">
          India loses 485 lives to road accidents every day.
          <span className="text-gray-900 font-bold block mt-1">Up to 40% can be saved with immediate bystander response.</span>
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-md mx-auto sm:max-w-none justify-center px-2">
          <Link
            to="/emergency"
            className="w-full sm:w-auto bg-red-600 text-white px-8 py-4 rounded-2xl font-black text-lg sm:text-xl shadow-xl shadow-red-600/30 hover:bg-red-700 active:scale-95 transition flex items-center justify-center gap-2 emergency-btn"
          >
            <Zap size={24} fill="currentColor" />
            <span>REPORT EMERGENCY</span>
          </Link>

          <Link
            to="/register"
            className="w-full sm:w-auto bg-white text-orange-600 border-2 border-orange-600 px-7 py-4 rounded-2xl font-bold text-base sm:text-lg hover:bg-orange-50 active:scale-95 transition flex items-center justify-center gap-2 shadow-sm"
          >
            <Users size={22} />
            <span>Become a Volunteer</span>
          </Link>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="bg-gray-900 text-white py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 text-center divide-y sm:divide-y-0 sm:divide-x divide-gray-800">
          <div className="p-2 sm:p-4">
            <div className="text-3xl sm:text-4xl md:text-5xl font-black text-red-500 mb-1">485</div>
            <div className="text-gray-400 font-bold uppercase tracking-wider text-xs sm:text-sm">Lives lost daily in India</div>
          </div>

          <div className="pt-4 sm:pt-2 p-2 sm:p-4">
            <div className="text-3xl sm:text-4xl md:text-5xl font-black text-green-400 mb-1">+40%</div>
            <div className="text-gray-400 font-bold uppercase tracking-wider text-xs sm:text-sm">Survival with prompt CPR</div>
          </div>

          <div className="pt-4 sm:pt-2 p-2 sm:p-4">
            <div className="text-3xl sm:text-4xl md:text-5xl font-black text-yellow-400 mb-1">100%</div>
            <div className="text-gray-400 font-bold uppercase tracking-wider text-xs sm:text-sm">Good Samaritan Law Shield</div>
          </div>
        </div>
      </section>

      {/* ── How it Works ── */}
      <section className="py-12 sm:py-16 md:py-20 px-4 max-w-7xl mx-auto w-full">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-4xl font-black text-gray-900 mb-2 sm:mb-4">How RescueLink AI Saves Lives</h2>
          <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
            Connecting accident victims, bystanders, trained volunteers, and emergency services in real time.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[
            { icon: <Zap size={28} className="text-red-600" />, title: "One-Tap Report", desc: "No forms. Instantly broadcasts exact GPS coordinates and accident scene photo." },
            { icon: <Mic size={28} className="text-blue-600" />, title: "AI Voice Assistant", desc: "Powered by Groq ultra-fast AI. Speaks clear first-aid and CPR instructions aloud." },
            { icon: <Users size={28} className="text-orange-600" />, title: "Nearby Volunteers", desc: "Pings registered CPR-trained volunteers within 2km for sub-5 minute response." },
            { icon: <Shield size={28} className="text-green-600" />, title: "Legal Protection", desc: "Generates digital certificate under India's Good Samaritan Law 2016." },
            { icon: <BookOpen size={28} className="text-purple-600" />, title: "Offline First Aid", desc: "Step-by-step CPR and trauma guides that work with zero internet on highways." },
            { icon: <Phone size={28} className="text-red-600" />, title: "112 Integration", desc: "1-tap national emergency dispatch with automated incident logging." }
          ].map((feature, i) => (
            <div key={i} className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-4">{feature.icon}</div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Good Samaritan Law Callout ── */}
      <section className="px-4 py-8 sm:py-12 max-w-5xl mx-auto w-full">
        <div className="bg-amber-100/80 rounded-3xl p-6 sm:p-10 border-2 border-amber-300/80 flex flex-col md:flex-row items-center gap-6 sm:gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="text-amber-700" size={26} />
              <h2 className="text-xl sm:text-2xl font-black text-gray-900">Hesitant to Help?</h2>
            </div>
            <p className="text-gray-800 text-sm sm:text-base mb-5 leading-relaxed">
              Under India's <strong>Good Samaritan Law (2016)</strong>, helpers are legally protected.
              You cannot be detained by police, forced to pay hospital fees, or held civilly/criminally liable.
            </p>
            <Link
              to="/shield"
              className="inline-flex items-center gap-2 font-bold text-amber-800 hover:text-amber-950 text-sm sm:text-base bg-amber-200/80 px-4 py-2 rounded-xl transition"
            >
              <span>View Your 6 Legal Rights</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="w-full md:w-1/3">
            <img
              src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&q=80&w=400&h=260"
              alt="Good Samaritan help"
              className="rounded-2xl shadow-md object-cover w-full h-40 sm:h-48"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4 text-center mt-auto border-t border-gray-800">
        <p className="mb-1 text-white font-bold text-lg">🚨 RescueLink AI</p>
        <p className="text-xs text-gray-500">Every second counts. Be the help. Designed for India.</p>
      </footer>
    </div>
  );
}

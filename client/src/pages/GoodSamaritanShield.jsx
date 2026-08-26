import { Shield, Printer, CheckCircle, Award, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function GoodSamaritanShield() {
  const { user } = useAuth();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 bg-gray-50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8 sm:space-y-12">

        {/* ── Header ── */}
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-green-100 text-green-700 rounded-full mb-2 shadow-sm">
            <Shield size={36} className="sm:w-12 sm:h-12" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
            You Are Legally Protected
          </h1>
          <p className="text-sm sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed px-2">
            Under India's <strong>Good Samaritan Law (2016)</strong> and Supreme Court directives, bystanders who help accident victims cannot be harassed by police, forced to pay hospital bills, or sued.
          </p>
        </div>

        {/* ── Digital Certificate Card ── */}
        <div className="bg-white p-5 sm:p-8 rounded-3xl shadow-lg border-2 border-green-500 relative overflow-hidden print:shadow-none print:border-4 print:border-black">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 border-b border-gray-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <Award className="text-green-600" size={24} />
                <h2 className="text-lg sm:text-2xl font-black text-gray-900">
                  Digital Protection Certificate
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Section 134A, Motor Vehicles (Amendment) Act, 2019
              </p>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition print:hidden shadow-sm"
            >
              <Printer size={16} /> Print / Save Card
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            <div className="space-y-3 sm:space-y-4">
              <div>
                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Responder Name</div>
                <div className="text-base sm:text-xl font-black text-gray-900">
                  {user?.name || 'Registered Good Samaritan Helper'}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">RescueLink Token ID</div>
                <div className="text-sm sm:text-base font-mono text-gray-700">
                  {user?._id || 'RL-SEC-SAMARITAN-2026'}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Date Active</div>
                <div className="text-sm sm:text-base text-gray-700 font-medium">
                  {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>

            <div className="bg-green-50/80 p-4 sm:p-5 rounded-2xl border border-green-200 flex flex-col justify-center">
              <p className="text-green-950 text-xs sm:text-sm font-medium leading-relaxed italic">
                "Any person who in good faith, voluntarily and without expectation of any reward or compensation renders emergency medical or non-medical assistance to a victim at the scene of an accident shall not be liable for any civil or criminal action."
              </p>
            </div>
          </div>
        </div>

        {/* ── 6 Legal Rights Grid ── */}
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-4 sm:mb-6 text-center">
            Your 6 Supreme Court Guarantees
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[
              { title: "No Police Harassment", desc: "You cannot be detained, questioned against your will, or pressured into statements." },
              { title: "Right to Remain Anonymous", desc: "You are not obligated to disclose your name, address, or phone number." },
              { title: "Zero Hospital Liability", desc: "Hospitals cannot demand treatment money or admission deposits from the Samaritan." },
              { title: "Full Civil & Criminal Immunity", desc: "You cannot be sued or prosecuted for accidental injury or demise during first aid." },
              { title: "Immediate Departure Allowed", desc: "You may leave the hospital right after handing the victim over to medical staff." },
              { title: "Voluntary Witness Only", desc: "You cannot be compelled to attend court hearings unless you willingly volunteer." }
            ].map((right, i) => (
              <div key={i} className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-3">
                <div className="mt-0.5 text-green-600 flex-shrink-0">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-1">{right.title}</h4>
                  <p className="text-gray-600 text-xs leading-relaxed">{right.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

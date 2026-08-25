import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  Play, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Mic, 
  CheckCircle 
} from 'lucide-react';

export const LandingHero: React.FC = () => {
  const [activeTabPreview, setActiveTabPreview] = useState<'payroll' | 'attendance' | 'meeting'>('payroll');

  return (
    <section className="relative pt-36 pb-20 sm:pt-40 md:pt-48 md:pb-28 overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100/60 text-slate-900">
      {/* Subtle Background Glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary-green/10 blur-[120px] rounded-full pointer-events-none -z-0"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Top Badge (Keka Style) */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-sm">
            <Sparkles className="h-4 w-4 text-emerald-600 animate-pulse" />
            <span>Modern HR, Payroll & AI Collaboration Platform</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-950 leading-[1.08]">
            Everything you need to build a{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-primary-green to-teal-600">
              great company culture
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-600 font-normal max-w-3xl mx-auto leading-relaxed">
            Automate modern payroll, GPS attendance, leave approvals, AI video meetings, and agile sprint tracking — in one cohesive, delightfully simple platform.
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="w-full sm:w-auto px-8 py-4 bg-primary-green hover:bg-dark-green text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-emerald-700/20 flex items-center justify-center space-x-2.5 transition-all hover:scale-105"
            >
              <span>Start Free 14-Day Trial</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href="#services"
              className="w-full sm:w-auto px-7 py-4 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center space-x-2 transition-colors"
            >
              <Play className="h-4 w-4 text-primary-green fill-primary-green" />
              <span>Explore All Products</span>
            </a>
          </div>

          {/* Trust Guarantees */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-semibold">
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="h-4 w-4 text-primary-green" />
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="h-4 w-4 text-primary-green" />
              <span>100% Statutory Compliant</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Clock className="h-4 w-4 text-primary-green" />
              <span>Setup in Under 2 Minutes</span>
            </div>
          </div>
        </div>

        {/* Hero Interactive App Showcase Card (Keka UI Mockup) */}
        <div className="mt-12 sm:mt-16 relative max-w-5xl mx-auto">
          {/* Subtle Ambient Frame Shadow */}
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-emerald-500/20 via-teal-400/20 to-primary-green/20 blur-xl opacity-70"></div>

          <div className="relative bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden">
            {/* Top Browser Bar */}
            <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-rose-400"></div>
                <div className="h-3 w-3 rounded-full bg-amber-400"></div>
                <div className="h-3 w-3 rounded-full bg-emerald-400"></div>
                <span className="text-xs text-slate-500 font-mono ml-2 hidden sm:inline font-medium">
                  https://app.patternshr.com
                </span>
              </div>

              {/* Preview Switcher */}
              <div className="flex items-center space-x-1 bg-slate-200/80 p-1 rounded-xl text-[11px] font-bold">
                <button
                  onClick={() => setActiveTabPreview('payroll')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeTabPreview === 'payroll'
                      ? 'bg-white text-slate-900 shadow-sm font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Payroll & Tax
                </button>

                <button
                  onClick={() => setActiveTabPreview('attendance')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeTabPreview === 'attendance'
                      ? 'bg-white text-slate-900 shadow-sm font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  GPS Attendance
                </button>

                <button
                  onClick={() => setActiveTabPreview('meeting')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeTabPreview === 'meeting'
                      ? 'bg-white text-slate-900 shadow-sm font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  AI Video Meeting
                </button>
              </div>
            </div>

            {/* Showcase View 1: Payroll Run */}
            {activeTabPreview === 'payroll' && (
              <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-8 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <div className="text-xs font-extrabold text-slate-900">August 2026 Salary Disbursement</div>
                      <div className="text-[11px] text-slate-500">Auto-calculated with tax formulas & leaves</div>
                    </div>
                    <span className="px-3 py-1 bg-emerald-50 text-primary-green border border-emerald-200 rounded-full text-xs font-bold">
                      ✓ Ready to Process
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Total Net Salaries</div>
                      <div className="text-2xl font-black text-slate-900">$142,850.00</div>
                      <div className="text-[10px] text-emerald-600 font-semibold">126 Employees</div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Tax Deductions</div>
                      <div className="text-2xl font-black text-slate-700">$24,190.00</div>
                      <div className="text-[10px] text-slate-500 font-semibold">Automated W-2 / PF</div>
                    </div>

                    <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-1">
                      <div className="text-[10px] text-emerald-800 font-bold uppercase">Time Saved</div>
                      <div className="text-2xl font-black text-primary-green">3.8 Days</div>
                      <div className="text-[10px] text-emerald-700 font-semibold">Zero spreadsheet manual entry</div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3 text-xs">
                  <div className="font-extrabold text-slate-900 flex items-center space-x-1.5">
                    <CheckCircle className="h-4 w-4 text-primary-green" />
                    <span>Statutory Compliance</span>
                  </div>
                  <ul className="space-y-2 text-[11px] text-slate-600">
                    <li>• Direct bank transfer generation</li>
                    <li>• One-click PDF payslip delivery</li>
                    <li>• Configurable bonuses & allowances</li>
                  </ul>
                  <div className="pt-2">
                    <div className="w-full py-2.5 bg-primary-green text-white text-center rounded-xl font-bold text-xs shadow-sm">
                      Run Payroll in 1 Click
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Showcase View 2: Attendance */}
            {activeTabPreview === 'attendance' && (
              <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="text-xs text-slate-500 font-bold uppercase">Checked In Today</div>
                  <div className="text-3xl font-black text-primary-green">98.4%</div>
                  <p className="text-xs text-slate-600">124 of 126 active employees on duty</p>
                </div>

                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="text-xs text-slate-500 font-bold uppercase">GPS Geo-Fenced Check-in</div>
                  <div className="text-3xl font-black text-blue-600">100% Verified</div>
                  <p className="text-xs text-slate-600">Office coordinates & IP validation</p>
                </div>

                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="text-xs text-slate-500 font-bold uppercase">Automated Overtime</div>
                  <div className="text-3xl font-black text-amber-600">8.2 hrs/avg</div>
                  <p className="text-xs text-slate-600">Directly syncs to monthly payroll</p>
                </div>
              </div>
            )}

            {/* Showcase View 3: Meeting */}
            {activeTabPreview === 'meeting' && (
              <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-8 bg-[#171A1C] rounded-2xl p-6 text-white space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-300">
                    <span className="font-bold">Team Sprint Planning Call</span>
                    <span className="flex items-center space-x-1 text-primary-green font-bold">
                      <Mic className="h-3.5 w-3.5" />
                      <span>Live Speech-to-Text</span>
                    </span>
                  </div>
                  <div className="p-3 bg-black/60 rounded-xl text-xs text-gray-200 border border-white/10">
                    &ldquo;Let&apos;s approve the new UI updates and assign the sprint backlog tickets.&rdquo;
                  </div>
                </div>

                <div className="md:col-span-4 bg-emerald-50 p-4 rounded-2xl border border-emerald-200 space-y-2 text-xs">
                  <div className="font-extrabold text-emerald-950 flex items-center space-x-1.5">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    <span>Instant AI Action Item</span>
                  </div>
                  <p className="text-slate-700 text-[11px] leading-relaxed">
                    Assigned 4 sprint tickets directly to Jira & Sprint Board with zero manual copying.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Social Proof Numbers (Keka Style) */}
        <div className="mt-16 pt-10 border-t border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl sm:text-4xl font-black text-slate-950">500+</div>
            <div className="text-xs text-slate-500 font-bold mt-1">Companies Powered</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-primary-green">99.99%</div>
            <div className="text-xs text-slate-500 font-bold mt-1">WebRTC Video Uptime</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-slate-950">4.8x</div>
            <div className="text-xs text-slate-500 font-bold mt-1">Faster Payroll Processing</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-primary-green">98.9%</div>
            <div className="text-xs text-slate-500 font-bold mt-1">Employee Satisfaction</div>
          </div>
        </div>
      </div>
    </section>
  );
};

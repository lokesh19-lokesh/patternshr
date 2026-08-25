import React, { useState } from 'react';
import { 
  Video, 
  Clock, 
  Kanban, 
  DollarSign, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const LandingFeatureTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'meetings' | 'attendance' | 'sprints' | 'payroll'>('meetings');

  return (
    <section id="features" className="py-24 bg-slate-50 text-slate-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-primary-green" />
            <span>Interactive Product Tour</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
            Designed for Speed, Simplicity & Scale
          </h2>

          <p className="text-base text-slate-600">
            Click through our signature workflows to see how PatternsHR eliminates administrative friction.
          </p>
        </div>

        {/* Tab Buttons (Keka Style) */}
        <div className="mt-12 flex flex-wrap justify-center gap-2 p-1.5 bg-slate-200/80 max-w-2xl mx-auto rounded-2xl border border-slate-300/60">
          <button
            onClick={() => setActiveTab('meetings')}
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition-all ${
              activeTab === 'meetings'
                ? 'bg-white text-slate-900 shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Video className="h-4 w-4 text-primary-green" />
            <span>AI Meetings</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition-all ${
              activeTab === 'attendance'
                ? 'bg-white text-slate-900 shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="h-4 w-4 text-blue-600" />
            <span>Geo Attendance</span>
          </button>

          <button
            onClick={() => setActiveTab('sprints')}
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition-all ${
              activeTab === 'sprints'
                ? 'bg-white text-slate-900 shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Kanban className="h-4 w-4 text-purple-600" />
            <span>Agile Sprints</span>
          </button>

          <button
            onClick={() => setActiveTab('payroll')}
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition-all ${
              activeTab === 'payroll'
                ? 'bg-white text-slate-900 shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="h-4 w-4 text-emerald-600" />
            <span>1-Click Payroll</span>
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="mt-10 bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl">
          {/* TAB 1: MEETINGS */}
          {activeTab === 'meetings' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-fade-in">
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
                  <Sparkles className="h-3.5 w-3.5 text-primary-green" />
                  <span>Next-Gen Video Conferencing</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-950">
                  Meet, Decide & Automate Action Items in Real Time
                </h3>

                <p className="text-sm text-slate-600 leading-relaxed">
                  Never lose track of meeting minutes again. PatternsHR records spoken conversation transcripts in real time, automatically extracts assigned to-dos with @mentions, and generates concise summaries for team review.
                </p>

                <div className="space-y-3 text-xs text-slate-700 font-medium">
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="h-4 w-4 text-primary-green flex-shrink-0" />
                    <span>No plugins or third-party bots needed — built right into your workspace.</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="h-4 w-4 text-primary-green flex-shrink-0" />
                    <span>Picture-in-Picture (PiP) allows working in other tabs while watching video.</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="h-4 w-4 text-primary-green flex-shrink-0" />
                    <span>Post-meeting recap modal with 1-click text export and minutes copy.</span>
                  </div>
                </div>

                <Link
                  to="/signup"
                  className="inline-flex items-center space-x-2 text-primary-green font-extrabold text-xs hover:underline"
                >
                  <span>Launch your first video room now</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="lg:col-span-6 bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4 shadow-inner">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <span className="font-extrabold text-xs text-slate-900">Live AI Meeting Summary</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Generated in 1.2s
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1 shadow-sm">
                    <span className="text-[10px] text-emerald-700 font-bold uppercase">Decisions Made</span>
                    <p className="text-slate-700 text-xs">Approved expansion of engineering team with 4 new Senior Fullstack engineers.</p>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1 shadow-sm">
                    <span className="text-[10px] text-blue-700 font-bold uppercase">Assigned Tasks</span>
                    <div className="flex items-center justify-between text-xs text-slate-900 font-medium">
                      <span>Post job listings on portal</span>
                      <span className="text-primary-green font-bold">@HR_Lead</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-fade-in">
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-xs font-bold border border-blue-200">
                  <Clock className="h-3.5 w-3.5 text-blue-600" />
                  <span>Zero-Dispute Time Tracking</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-950">
                  Geo-Fenced & IP-Verified Attendance Logs
                </h3>

                <p className="text-sm text-slate-600 leading-relaxed">
                  Guarantee workforce accountability across office branches and remote teams. Track check-ins, early departures, and overtime with cryptographic location verification.
                </p>

                <div className="space-y-3 text-xs text-slate-700 font-medium">
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <span>Real-time presence ticker showing who is active right now.</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <span>Automatic sync with monthly payroll time sheets.</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <span className="font-extrabold text-xs text-slate-900">Today&apos;s Attendance Breakdown</span>
                  <span className="text-[10px] text-slate-500 font-mono">Live Sync</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-slate-500 text-[10px] uppercase font-bold">On Time</div>
                    <div className="text-2xl font-black text-emerald-600 mt-1">118 Staff</div>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-slate-500 text-[10px] uppercase font-bold">Approved Leaves</div>
                    <div className="text-2xl font-black text-amber-600 mt-1">6 Staff</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SPRINTS */}
          {activeTab === 'sprints' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-fade-in">
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center space-x-2 px-3 py-1 bg-purple-50 text-purple-800 rounded-full text-xs font-bold border border-purple-200">
                  <Kanban className="h-3.5 w-3.5 text-purple-600" />
                  <span>Agile Project Management</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-950">
                  Sprint Planning Built for Modern High-Velocity Teams
                </h3>

                <p className="text-sm text-slate-600 leading-relaxed">
                  Bridge the gap between HR and project execution. Assign tasks, track burndown charts, manage story points, and review team velocity within the same platform.
                </p>
              </div>

              <div className="lg:col-span-6 bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-3">
                <div className="text-xs font-extrabold text-slate-900 mb-2">Sprint 24 Board (In Progress)</div>
                <div className="grid grid-cols-3 gap-2.5 text-[10px]">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 shadow-sm">
                    <span className="font-extrabold text-slate-500">TO DO (4)</span>
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-800 font-bold">Design Mockups</div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 shadow-sm">
                    <span className="font-extrabold text-amber-600">IN PROGRESS (2)</span>
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 font-bold">WebRTC Video</div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 shadow-sm">
                    <span className="font-extrabold text-emerald-600">DONE (8)</span>
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 font-bold">PDF Payslips</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PAYROLL */}
          {activeTab === 'payroll' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-fade-in">
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Compliant Compensation</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-950">
                  Accurate, Stress-Free 1-Click Monthly Payroll
                </h3>

                <p className="text-sm text-slate-600 leading-relaxed">
                  Eliminate spreadsheet errors. PatternsHR integrates real-time attendance, unpaid leaves, tax brackets, and bonuses to generate instant compliant payslips.
                </p>
              </div>

              <div className="lg:col-span-6 bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-extrabold text-slate-900 border-b border-slate-200 pb-2">
                  <span>August 2026 Payroll Run</span>
                  <span className="text-primary-green">Status: Ready to Disburse</span>
                </div>
                <div className="p-4 bg-white rounded-xl flex items-center justify-between text-xs border border-slate-200 shadow-sm">
                  <div>
                    <div className="font-bold text-slate-900">Total Net Salaries</div>
                    <div className="text-[10px] text-slate-500">126 Active Staff</div>
                  </div>
                  <div className="text-lg font-black text-slate-950">$142,850.00</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

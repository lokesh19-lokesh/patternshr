import React from 'react';
import { 
  DollarSign, 
  Clock, 
  Video, 
  Calendar, 
  Kanban, 
  FileText, 
  MessageSquare, 
  TrendingUp, 
  Check, 
  ArrowRight,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const LandingServices: React.FC = () => {
  const suites = [
    {
      id: 'payroll',
      icon: DollarSign,
      badge: '1-Click Run',
      title: 'Automated Payroll & Statutory Tax',
      desc: 'Run accurate, 100% compliant monthly payroll in under 4 minutes. Automatically handles gross-to-net calculations, tax deductions, bonuses, and encrypted PDF payslips.',
      features: [
        '1-Click automated salary processing & direct deposit',
        'Configurable tax formulas, PF & allowance rules',
        'Automated deduction of unpaid leaves & overtime',
        'Employee self-service payslip download portal',
      ],
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      id: 'attendance',
      icon: Clock,
      badge: 'Geo-Fenced & GPS',
      title: 'Smart Attendance & Shift Scheduling',
      desc: 'Frictionless clock-in with geo-fencing, IP verification, and live presence status. Automate shift management, late marks, and overtime tracking.',
      features: [
        'GPS geofence & company IP address check-in',
        'Live real-time employee presence indicators',
        'Shift schedules, rotations & overtime calculation',
        'Instant timesheet sync with monthly payroll',
      ],
      iconBg: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      id: 'meetings',
      icon: Video,
      badge: 'AI-Native WebRTC',
      title: 'AI Video Meetings & Virtual Rooms',
      desc: 'Crystal-clear, encrypted video conferencing with built-in AI speech-to-text live captions, automated meeting minutes, and instant action item extraction.',
      features: [
        'Real-time live speech-to-text captions',
        'Automated AI summary, key decisions & @mentions',
        'Screen sharing & Picture-in-Picture (PiP) multitasking',
        'Host waiting room security & cloud recording storage',
      ],
      iconBg: 'bg-emerald-50 text-primary-green border-emerald-200',
    },
    {
      id: 'leave',
      icon: Calendar,
      badge: 'Multi-Tier Approvals',
      title: 'Leave & Time-Off Lifecycle',
      desc: 'Simplify vacation, casual, and medical leave requests with automated approval chains, real-time balance ledgers, and national holiday calendars.',
      features: [
        'Casual, sick, annual & parental leave categories',
        'Hierarchical manager approval workflows',
        'Real-time balance accruals & comp-off ledgers',
        'Company & regional holiday calendar sync',
      ],
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
    },
    {
      id: 'work',
      icon: Kanban,
      badge: 'Agile & Sprints',
      title: 'Agile Task & Sprint Management',
      desc: 'Bridge the gap between HR and project execution. Visual drag-and-drop Kanban boards, sprint backlogs, task delegation, and velocity metrics.',
      features: [
        'Interactive drag-and-drop Kanban boards',
        'Sprint planning, story points & backlog manager',
        'Subtasks, due dates, priority tags & time tracking',
        'Productivity velocity logs & completion analytics',
      ],
      iconBg: 'bg-purple-50 text-purple-600 border-purple-200',
    },
    {
      id: 'chat',
      icon: MessageSquare,
      badge: 'Real-Time Sync',
      title: 'Team Chat & Department Channels',
      desc: 'Unify company communication with direct 1-on-1 messaging, department channels, file sharing, voice notes, and 1-click video call escalation.',
      features: [
        'Direct messaging & group department channels',
        '1-Click instant video meeting launching',
        'Voice audio notes & rich file attachments',
        'Real-time typing status & unread counters',
      ],
      iconBg: 'bg-cyan-50 text-cyan-600 border-cyan-200',
    },
    {
      id: 'documents',
      icon: FileText,
      badge: 'Encrypted Vault',
      title: 'Document Cloud & Compliance Vault',
      desc: 'Digitize personnel files, employment contracts, NDA agreements, and certifications in an encrypted cloud repository with granular access control.',
      features: [
        'Digital employee personnel file management',
        'Employment contracts, offer letters & NDA vault',
        'Document expiry & policy renewal reminders',
        'Granular role-based security & audit logs',
      ],
      iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
    },
    {
      id: 'analytics',
      icon: TrendingUp,
      badge: 'Executive Insights',
      title: 'People Analytics & Executive Reports',
      desc: 'Make informed workforce decisions with visual analytics on headcount, department expenditure, attrition rates, and attendance patterns.',
      features: [
        'Workforce headcount growth & attrition trends',
        'Department budget & compensation distributions',
        'Custom report builder with CSV/PDF exports',
        'Executive dashboards for Leadership & HR Admins',
      ],
      iconBg: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    },
  ];

  return (
    <section id="services" className="py-24 bg-white text-slate-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header (Keka Style) */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
            <Zap className="h-3.5 w-3.5 text-primary-green" />
            <span>The All-In-One HR Suite</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
            Every HR Module, Seamlessly Connected
          </h2>

          <p className="text-base text-slate-600 leading-relaxed">
            Eliminate fragmented tools. PatternsHR unites employee communication, project tracking, attendance, and payroll into one unified platform.
          </p>
        </div>

        {/* Modular 8-Grid (Keka Card Style) */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {suites.map((suite) => {
            const Icon = suite.icon;
            return (
              <div
                key={suite.id}
                id={suite.id === 'meetings' ? 'meetings' : undefined}
                className="p-6 rounded-3xl bg-slate-50 border border-slate-200/90 hover:border-emerald-300 hover:shadow-xl hover:bg-white transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  {/* Top Icon & Badge */}
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-2xl border ${suite.iconBg} shadow-sm group-hover:scale-110 transition-transform`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[10px] font-bold text-slate-700 shadow-sm">
                      {suite.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 group-hover:text-primary-green transition-colors">
                      {suite.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {suite.desc}
                    </p>
                  </div>

                  {/* Feature Bullets */}
                  <ul className="space-y-2 pt-2 border-t border-slate-200/70 text-xs text-slate-700">
                    {suite.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <Check className="h-3.5 w-3.5 text-primary-green flex-shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-tight font-medium">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6">
                  <Link
                    to="/signup"
                    className="w-full py-2.5 px-4 bg-white hover:bg-primary-green hover:text-white text-slate-800 text-xs font-bold rounded-xl border border-slate-200 shadow-sm flex items-center justify-center space-x-1.5 transition-all"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

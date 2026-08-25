import React from 'react';
import { Check, X, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LandingComparison: React.FC = () => {
  const comparisonRows = [
    {
      feature: 'Payroll Processing Time',
      traditional: '3 to 5 days of manual spreadsheets & calculations',
      patternshr: 'Under 4 minutes with 1-click automated gross-to-net',
    },
    {
      feature: 'Video Conferencing & AI Minutes',
      traditional: 'Separate expensive Zoom/Teams licenses + AI bots',
      patternshr: 'Built-in encrypted WebRTC with live speech-to-text notes',
    },
    {
      feature: 'Attendance & Overtime Tracking',
      traditional: 'Manual punch cards & unverified paper registers',
      patternshr: '100% Geo-fenced GPS & IP verification with live presence',
    },
    {
      feature: 'Agile Sprint & Task Management',
      traditional: 'Disconnected project tools requiring separate logins',
      patternshr: 'Integrated Kanban boards, backlogs & team velocity metrics',
    },
    {
      feature: 'Leave Approvals & Holiday Sync',
      traditional: 'Slow email chains & unrecorded balance discrepancies',
      patternshr: '1-Click multi-tier hierarchy approvals & live ledgers',
    },
    {
      feature: 'Document Cloud & Compliance',
      traditional: 'Physical paperwork & scattered Google Drive folders',
      patternshr: 'Encrypted digital personnel vault with audit logs',
    },
  ];

  return (
    <section id="comparison" className="py-24 bg-slate-50 text-slate-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-primary-green" />
            <span>The Modern Advantage</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
            Why High-Growth Companies Switch to PatternsHR
          </h2>

          <p className="text-base text-slate-600">
            See how modern workforce automation replaces legacy administrative bottlenecks.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="mt-14 max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 bg-slate-100/80 border-b border-slate-200 p-4 sm:p-5 text-xs font-extrabold">
            <div className="col-span-4 text-slate-700 uppercase tracking-wider">Capability</div>
            <div className="col-span-4 text-slate-500 uppercase tracking-wider">Legacy HR Systems</div>
            <div className="col-span-4 text-emerald-700 uppercase tracking-wider flex items-center space-x-1">
              <span>PatternsHR Platform</span>
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-100 text-xs font-medium">
            {comparisonRows.map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 p-4 sm:p-5 items-center hover:bg-slate-50/60 transition-colors"
              >
                <div className="col-span-4 font-bold text-slate-900 pr-2">
                  {row.feature}
                </div>

                <div className="col-span-4 text-slate-500 pr-3 flex items-start space-x-1.5">
                  <X className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{row.traditional}</span>
                </div>

                <div className="col-span-4 text-slate-900 font-semibold flex items-start space-x-1.5 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                  <Check className="h-4 w-4 text-primary-green flex-shrink-0 mt-0.5 font-black" />
                  <span className="text-slate-900 leading-relaxed">{row.patternshr}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Table Footer */}
          <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-600">
              Ready to upgrade your company infrastructure to modern standards?
            </div>
            <Link
              to="/signup"
              className="px-6 py-2.5 bg-primary-green hover:bg-dark-green text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-2 transition-all hover:scale-105"
            >
              <span>Get Started Free</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

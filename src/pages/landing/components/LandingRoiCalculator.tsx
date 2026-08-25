import React, { useState } from 'react';
import { Calculator, TrendingUp, Clock, DollarSign, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LandingRoiCalculator: React.FC = () => {
  const [employeeCount, setEmployeeCount] = useState<number>(45);

  // Calculations
  const hoursSavedPerMonth = Math.round(employeeCount * 3.4);
  const monthlyCostSavings = Math.round(hoursSavedPerMonth * 35);
  const annualSavings = monthlyCostSavings * 12;

  return (
    <section id="calculator" className="py-24 bg-white text-slate-900 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
            <Calculator className="h-3.5 w-3.5 text-primary-green" />
            <span>Productivity & ROI Calculator</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
            See How Much Time & Money You Save
          </h2>

          <p className="text-base text-slate-600">
            Slide to your company size to estimate monthly administrative hours recovered and bottom-line ROI.
          </p>
        </div>

        {/* Interactive Box */}
        <div className="mt-14 max-w-4xl mx-auto bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl">
          <div className="space-y-8">
            {/* Slider Control */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-extrabold text-slate-900">Your Team Headcount</label>
                <div className="px-4 py-1.5 bg-emerald-50 text-primary-green rounded-xl text-lg font-black border border-emerald-200 font-mono shadow-sm">
                  {employeeCount} Employees
                </div>
              </div>

              <input
                type="range"
                min="5"
                max="500"
                step="5"
                value={employeeCount}
                onChange={(e) => setEmployeeCount(Number(e.target.value))}
                className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-green"
              />

              <div className="flex justify-between text-[11px] text-slate-500 font-bold">
                <span>5 Members</span>
                <span>250 Employees</span>
                <span>500+ Enterprise</span>
              </div>
            </div>

            {/* Results Output Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
              <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-1 shadow-sm">
                <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-bold uppercase">
                  <Clock className="h-4 w-4 text-primary-green" />
                  <span>Hours Saved / Month</span>
                </div>
                <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">
                  {hoursSavedPerMonth} <span className="text-sm font-normal text-slate-500">hrs</span>
                </div>
                <p className="text-[11px] text-slate-500">Eliminating manual HR spreadsheet entry</p>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-1 shadow-sm">
                <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-bold uppercase">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <span>Monthly Cost Savings</span>
                </div>
                <div className="text-3xl sm:text-4xl font-black text-emerald-600 font-mono">
                  ${monthlyCostSavings.toLocaleString()}
                </div>
                <p className="text-[11px] text-slate-500">Consolidating video, chat & payroll SaaS</p>
              </div>

              <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 space-y-1 shadow-sm">
                <div className="flex items-center space-x-1.5 text-xs text-emerald-800 font-bold uppercase">
                  <TrendingUp className="h-4 w-4 text-primary-green" />
                  <span>Annual Estimated ROI</span>
                </div>
                <div className="text-3xl sm:text-4xl font-black text-slate-950 font-mono">
                  ${annualSavings.toLocaleString()}
                </div>
                <p className="text-[11px] text-emerald-800 font-semibold">Direct impact on company bottom-line</p>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-2 text-xs text-slate-600 font-medium">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Ready to claim these hours back for your leadership team?</span>
              </div>

              <Link
                to="/signup"
                className="px-6 py-3 bg-primary-green hover:bg-dark-green text-white text-xs font-extrabold rounded-xl shadow-lg shadow-emerald-700/20 flex items-center space-x-2 transition-all hover:scale-105"
              >
                <span>Unlock Productivity Now</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

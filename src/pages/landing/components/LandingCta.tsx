import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LandingCta: React.FC = () => {
  return (
    <section className="py-20 bg-white text-slate-900 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="relative rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-950 p-8 sm:p-14 border border-emerald-500/30 shadow-2xl overflow-hidden text-center space-y-6 text-white">
          <div className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-white/10 text-emerald-300 border border-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Join 500+ High-Performing Enterprises</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight max-w-2xl mx-auto leading-tight">
            Ready to Supercharge Your Workforce with PatternsHR?
          </h2>

          <p className="text-sm sm:text-base text-slate-200 max-w-xl mx-auto leading-relaxed font-normal">
            Set up your organization in less than 2 minutes. No credit card required, instant access to all AI video, attendance, and payroll features.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="w-full sm:w-auto px-8 py-4 bg-primary-green hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-950 flex items-center justify-center space-x-2 transition-all hover:scale-105"
            >
              <span>Get Started Free Today</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-2xl border border-white/20 transition-colors backdrop-blur-md"
            >
              <span>Sign In to Existing Account</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

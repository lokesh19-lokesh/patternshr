import React from 'react';
import { Star, Quote } from 'lucide-react';

export const LandingTestimonials: React.FC = () => {
  const testimonials = [
    {
      name: 'Rajesh Sharma',
      role: 'VP of Human Resources',
      company: 'Apex Tech Solutions (240 Employees)',
      quote: 'PatternsHR completely streamlined our end-of-month payroll. What used to take our HR team 4 days of manual spreadsheet reconciliation is now done in under 15 minutes with 100% compliance.',
      rating: 5,
      avatar: 'RS',
    },
    {
      name: 'Pooja Varma',
      role: 'Chief Operating Officer',
      company: 'Quantix Media (110 Employees)',
      quote: 'The built-in AI Video Meetings with instant speech-to-text action items has been a game-changer. We canceled our separate Zoom and recording bot subscriptions, saving over $1,400 every month.',
      rating: 5,
      avatar: 'PV',
    },
    {
      name: 'Aditya Mehta',
      role: 'Founder & CEO',
      company: 'CloudNova Digital (85 Employees)',
      quote: 'Having agile sprint management, biometric GPS attendance, and document vault in one place gives our leadership complete visibility without jumping between 5 different tabs.',
      rating: 5,
      avatar: 'AM',
    },
  ];

  return (
    <section className="py-24 bg-white text-slate-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
            <Quote className="h-3.5 w-3.5 text-primary-green" />
            <span>Customer Success Stories</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
            Loved by Fast-Growing Companies
          </h2>

          <p className="text-base text-slate-600">
            See how forward-thinking leaders scale their organizations effortlessly with PatternsHR.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="p-8 rounded-3xl bg-slate-50 border border-slate-200/90 hover:border-emerald-300 hover:shadow-xl hover:bg-white transition-all duration-300 flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                {/* Rating Stars */}
                <div className="flex items-center space-x-1 text-amber-400">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              {/* Author */}
              <div className="pt-4 border-t border-slate-200 flex items-center space-x-3.5">
                <div className="h-11 w-11 rounded-2xl bg-emerald-100 text-emerald-800 font-extrabold text-sm flex items-center justify-center border border-emerald-200 shadow-inner">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-extrabold text-xs text-slate-900">{t.name}</div>
                  <div className="text-[11px] text-slate-500">{t.role}</div>
                  <div className="text-[10px] text-emerald-600 font-bold">{t.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

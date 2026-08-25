import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const LandingFaq: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How is PatternsHR Video Meeting different from Zoom or Google Meet?',
      a: 'Unlike generic meeting tools, PatternsHR is deeply integrated with your workforce directory. Meeting notes, audio transcripts, and action items automatically link to employee profiles and agile task boards without requiring separate AI recording bots or third-party integrations.',
    },
    {
      q: 'Can we import our existing employee roster and payroll records?',
      a: 'Yes! PatternsHR supports bulk CSV and Excel imports for employee profiles, department structures, leave balances, and salary ledgers. Our onboarding wizard guides you through the process in minutes.',
    },
    {
      q: 'How does geo-fenced attendance tracking work for remote/hybrid staff?',
      a: 'When employees clock in via the mobile or web portal, PatternsHR verifies their device coordinates against allowed office geofences or company IP ranges (configurable per department).',
    },
    {
      q: 'Is our sensitive company data and payroll information safe?',
      a: 'Absolutely. We utilize PostgreSQL Row-Level Security (RLS) ensuring strict multi-tenant data isolation. All WebRTC calls are encrypted end-to-end via DTLS/SRTP, and documents are stored in encrypted cloud vaults.',
    },
    {
      q: 'Do I need to enter credit card details to start a free trial?',
      a: 'No credit card is required. You get immediate access to all Growth tier features, including automated payroll and AI video meetings, for 14 days.',
    },
  ];

  return (
    <section id="faq" className="py-24 bg-slate-50 text-slate-900 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="h-3.5 w-3.5 text-primary-green" />
            <span>Got Questions?</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
            Frequently Asked Questions
          </h2>

          <p className="text-base text-slate-600">
            Everything you need to know about setting up and running your company on PatternsHR.
          </p>
        </div>

        <div className="mt-12 space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between space-x-4 hover:bg-slate-50/60 transition-colors"
                >
                  <span className="text-sm font-extrabold text-slate-900">{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-primary-green transition-transform duration-200 flex-shrink-0 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

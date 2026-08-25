import React, { useState } from 'react';
import { Check, ArrowRight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LandingPricing: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      name: 'Starter',
      badge: 'Free Forever',
      desc: 'Ideal for early-stage startups and small agile teams up to 10 members.',
      price: '$0',
      period: 'forever free',
      highlighted: false,
      cta: 'Get Started Free',
      features: [
        'Up to 10 Active Employees',
        'Unlimited Encrypted Video Meetings',
        'Geo-fenced Attendance & Clock-in',
        'Leave Requests & Holiday Calendar',
        'Team Chat & Direct Channels',
        'Standard Community Support',
      ],
    },
    {
      name: 'Growth & AI Pro',
      badge: 'Most Popular',
      desc: 'Everything you need to automate payroll, agile sprints, and AI meeting intelligence.',
      price: isAnnual ? '$5' : '$7',
      period: 'per user / month',
      highlighted: true,
      cta: 'Start 14-Day Free Trial',
      features: [
        'Unlimited Company Headcount',
        'Real-time Speech-to-Text Live Captions',
        'Automated AI Meeting Minutes & Tasks',
        '1-Click Automated Monthly Payroll & Payslips',
        'Agile Sprint & Task Velocity Boards',
        'Document Cloud Vault & Contracts',
        'Priority 24/7 Support',
      ],
    },
    {
      name: 'Enterprise Scale',
      badge: 'Custom Tailored',
      desc: 'Dedicated infrastructure, custom payroll rules, SLA guarantees, and enterprise SSO.',
      price: 'Custom',
      period: 'contact sales',
      highlighted: false,
      cta: 'Talk to Enterprise Team',
      features: [
        'Custom Integrations & API Access',
        'SAML SSO & Okta / Google Workspace Sync',
        'Custom Tax Formulas for Global Multi-Entities',
        'Dedicated Technical Account Manager',
        '99.99% Uptime SLA Agreement',
        'Custom Employee Onboarding Training',
      ],
    },
  ];

  return (
    <section id="pricing" className="py-24 bg-white text-slate-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
            <Zap className="h-3.5 w-3.5 text-primary-green" />
            <span>Simple, Transparent Pricing</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
            Plans That Scale with Your Company
          </h2>

          <p className="text-base text-slate-600">
            No hidden setup fees. Full access 14-day free trial on all paid features.
          </p>

          {/* Monthly / Annual Billing Switcher (Keka Style) */}
          <div className="pt-6 flex items-center justify-center space-x-3 text-xs font-bold">
            <span className={!isAnnual ? 'text-slate-900 font-extrabold' : 'text-slate-500'}>Monthly</span>
            <button
              type="button"
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-12 h-6 bg-slate-200 rounded-full p-1 border border-slate-300 transition-colors relative"
            >
              <div
                className={`h-4 w-4 rounded-full bg-primary-green transition-transform ${
                  isAnnual ? 'translate-x-6' : 'translate-x-0'
                }`}
              ></div>
            </button>
            <span className={isAnnual ? 'text-slate-900 font-extrabold' : 'text-slate-500'}>
              Annual <span className="text-emerald-700 font-extrabold">(Save 25%)</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 ${
                plan.highlighted
                  ? 'bg-gradient-to-b from-emerald-50/70 to-white border-2 border-primary-green shadow-2xl shadow-emerald-900/15 scale-105 relative z-10'
                  : 'bg-slate-50 border border-slate-200/90 hover:border-slate-300 shadow-md'
              }`}
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                    {plan.name}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-extrabold ${
                      plan.highlighted
                        ? 'bg-primary-green text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-700 shadow-sm'
                    }`}
                  >
                    {plan.badge}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-4xl font-black text-slate-950 font-mono">{plan.price}</div>
                  <div className="text-xs text-slate-500 font-medium">{plan.period}</div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{plan.desc}</p>

                <div className="pt-4 border-t border-slate-200 space-y-3 text-xs">
                  <span className="text-[11px] font-extrabold text-slate-900 uppercase tracking-wider">
                    Included Features:
                  </span>
                  <ul className="space-y-2.5">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start space-x-2 text-slate-700">
                        <Check className="h-3.5 w-3.5 text-primary-green flex-shrink-0 mt-0.5 font-bold" />
                        <span className="text-xs leading-tight font-medium">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-8">
                <Link
                  to="/signup"
                  className={`w-full py-3.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-2 transition-all ${
                    plan.highlighted
                      ? 'bg-primary-green hover:bg-dark-green text-white shadow-lg shadow-emerald-700/20 hover:scale-105'
                      : 'bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 shadow-sm'
                  }`}
                >
                  <span>{plan.cta}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

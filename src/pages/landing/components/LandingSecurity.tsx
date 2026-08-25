import React from 'react';
import { ShieldCheck, Lock, Key, Server } from 'lucide-react';

export const LandingSecurity: React.FC = () => {
  const securityPillars = [
    {
      icon: Lock,
      title: 'End-to-End Encrypted WebRTC',
      desc: 'All real-time audio, video, and screen sharing streams are cryptographically secured using DTLS and SRTP protocols.',
      bg: 'bg-emerald-50 text-primary-green border-emerald-200',
    },
    {
      icon: Server,
      title: 'Multi-Tenant Database Isolation',
      desc: 'Strict PostgreSQL Row-Level Security (RLS) policies ensure each company’s employee and payroll data is completely isolated.',
      bg: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      icon: ShieldCheck,
      title: 'SOC-2 & GDPR Alignment',
      desc: 'Built according to international data protection, privacy guidelines, and employee data sovereignty standards.',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      icon: Key,
      title: 'Granular Role-Based Permissions',
      desc: 'Define custom access levels for Founders, HR Admins, Department Leads, and Employees with complete audit trailing.',
      bg: 'bg-purple-50 text-purple-600 border-purple-200',
    },
  ];

  return (
    <section className="py-24 bg-slate-50 text-slate-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="h-3.5 w-3.5 text-primary-green" />
            <span>Bank-Grade Trust & Compliance</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
            Enterprise Security at Every Layer
          </h2>

          <p className="text-base text-slate-600">
            We treat your company&apos;s sensitive employee records, payroll figures, and proprietary meeting minutes with the highest level of security.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {securityPillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="p-6 bg-white rounded-3xl border border-slate-200 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 space-y-3"
              >
                <div className={`p-3 rounded-2xl border ${p.bg} w-fit shadow-sm`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">{p.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{p.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const NOVA_VIDEO_URL = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260729_102822_0e6c87e8-c141-4744-bf32-ad30db296371.mp4';
const PORTRAIT_URL = 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260728_050334_5b076e26-0ce7-4898-b432-d764190e448f.png&w=1280&q=85';

export const LandingFeatureTabs: React.FC = () => {
  const [activeCapability, setActiveCapability] = useState<number>(0);

  const capabilities = [
    {
      idx: '01',
      title: 'Real-Time AI Video Minutes',
      body: 'Records spoken audio during team calls and extracts assigned Jira action items with zero manual copying.',
      tag: 'Live WebRTC Speech-to-Text'
    },
    {
      idx: '02',
      title: '1-Click Payroll & Tax Engine',
      body: 'Disburses compliant salaries with automated tax formulas, deductions, and encrypted PDF payslips in under 4 mins.',
      tag: '100% Statutory Compliant'
    },
    {
      idx: '03',
      title: 'Geo-Fenced Biometric Attendance',
      body: 'Validates employee coordinates and office IP ranges with zero-dispute attendance ledgers and overtime calculations.',
      tag: 'GPS & IP Verified'
    },
    {
      idx: '04',
      title: 'Agile Sprint & Task Velocity',
      body: 'Integrates Kanban boards, story points, and burndown charts directly into company employee profiles.',
      tag: 'Integrated Backlog'
    }
  ];

  return (
    <section id="features" className="relative py-20 sm:py-28 bg-[#0a0a0a] text-white overflow-hidden">
      {/* Background Ambient Video Layer */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <video
          src={NOVA_VIDEO_URL}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-35"
        />
        {/* Soft Vignette & Gradient Shading */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]/90 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/95 via-[#0a0a0a]/70 to-[#0a0a0a]/95 pointer-events-none"></div>
      </div>

      {/* Main Foreground Content */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 relative z-10 space-y-12 sm:space-y-16">
        
        {/* ========================================================================= */}
        {/* TOP ROW: Service Ticker + Editorial Intro                                 */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pt-4 border-b border-white/15 pb-8">
          {/* Left Service list */}
          <div className="space-y-1.5">
            <div className="font-mono text-xs uppercase tracking-[0.15em] text-white/90 drop-shadow-md">
              / AI WORKFORCE AUTOMATION
            </div>
            <div className="font-mono text-xs uppercase tracking-[0.15em] text-emerald-400 drop-shadow-md">
              / STATUTORY PAYROLL & TAX
            </div>
            <div className="font-mono text-xs uppercase tracking-[0.15em] text-white/90 drop-shadow-md">
              / REAL-TIME AI MEETING MINUTES
            </div>
          </div>

          {/* Right Editorial Statement */}
          <div className="max-w-md sm:text-right">
            <p className="text-base sm:text-lg leading-relaxed text-white drop-shadow-md font-normal">
              We design workforce automation that brings clarity, precision, and efficiency to the way your company operates.
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MAIN ROW: Left Headline & Contact Card + Right Frosted Capability Panel    */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Column: Badge + Big Title + CTAs + Advisor Glass Card */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            {/* Left-Accent Glass Badge */}
            <div className="inline-block border-l-2 border-primary-green bg-white/15 px-3.5 py-1.5 backdrop-blur-md">
              <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-white font-bold">
                Designed for Speed, Simplicity & Scale
              </span>
            </div>

            {/* Main Headline */}
            <h2 className="text-4xl sm:text-6xl lg:text-6.5xl font-normal leading-[1.08] tracking-tight text-white drop-shadow-lg">
              Clear. Precise.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-300 to-primary-green font-medium">
                Automated.
              </span>
            </h2>

            <p className="text-sm sm:text-base text-white/80 max-w-lg leading-relaxed drop-shadow-md">
              From biometric GPS clock-in to 1-click statutory tax disbursement, PatternsHR turns administrative friction into seamless velocity.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <Link
                to="/signup"
                className="rounded-full bg-white px-7 py-3.5 text-xs sm:text-sm font-bold text-black hover:bg-white/85 transition-all shadow-xl flex items-center space-x-2"
              >
                <span>Start Free 14-Day Trial</span>
                <ChevronRight className="h-4 w-4" />
              </Link>

              <a
                href="#pricing"
                className="rounded-full border border-white/25 bg-white/10 backdrop-blur-md px-6 py-3.5 text-xs sm:text-sm font-semibold text-white hover:bg-white/20 transition-all flex items-center space-x-2"
              >
                <span>Explore Pricing</span>
              </a>
            </div>

            {/* Glass Contact Card */}
            <div className="pt-3 max-w-md">
              <div className="flex items-center gap-4 rounded-2xl bg-white/10 p-3.5 backdrop-blur-md border border-white/15 shadow-2xl">
                <img
                  src={PORTRAIT_URL}
                  alt="Mitha, co-founder of PatternsHR"
                  className="h-20 w-16 sm:h-24 sm:w-20 rounded-xl object-cover flex-shrink-0 shadow-md"
                />
                <div className="space-y-1 pr-2">
                  <div className="text-sm font-bold text-white">Talk with Mitha</div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-emerald-300">
                    Co-founder of PatternsHR
                  </div>
                  <Link
                    to="/signup"
                    className="inline-flex items-center space-x-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-black hover:bg-white/85 transition-colors mt-1 shadow-sm"
                  >
                    <span>Book 15-mins call</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Frosted Capability Panel (4 Numbered Rows) */}
          <div className="lg:col-span-5">
            <div className="w-full rounded-3xl border border-white/15 bg-white/10 backdrop-blur-md p-6 sm:p-7 shadow-2xl space-y-2">
              <div className="flex items-center justify-between pb-3 border-b border-white/15">
                <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/70">
                  Platform Capabilities
                </span>
                <span className="h-2 w-2 rounded-full bg-primary-green animate-pulse"></span>
              </div>

              <div className="divide-y divide-white/15">
                {capabilities.map((cap, idx) => {
                  const isSelected = activeCapability === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => setActiveCapability(idx)}
                      className={`py-4 cursor-pointer group transition-all ${
                        isSelected ? 'opacity-100 bg-white/[0.04] -mx-2 px-2 rounded-xl' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="font-mono text-[11px] tracking-[0.15em] text-emerald-400 font-bold">
                            {cap.idx}
                          </span>
                          <h4 className="text-sm sm:text-base font-medium text-white group-hover:text-emerald-300 transition-colors">
                            {cap.title}
                          </h4>
                        </div>
                        <ChevronRight className="h-4 w-4 text-white/40 group-hover:translate-x-1 group-hover:text-white transition-all" />
                      </div>

                      <p className="mt-1.5 text-xs leading-relaxed text-white/80 pl-7">
                        {cap.body}
                      </p>

                      {isSelected && (
                        <div className="mt-2.5 pl-7">
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
                            {cap.tag}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

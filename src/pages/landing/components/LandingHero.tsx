import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  Play, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Mic, 
  CheckCircle,
  ArrowDown,
  DollarSign,
  Video
} from 'lucide-react';

const VIDEO_SRC = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260821_114821_a8ca298f-be2c-4613-a4dd-51b69e16bbde.mp4';

export const LandingHero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeTabPreview, setActiveTabPreview] = useState<'payroll' | 'attendance' | 'meeting'>('payroll');

  useEffect(() => {
    let animFrameId: number;
    let targetTime = 0;
    let currentTime = 0;

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalScrollable = containerRef.current.offsetHeight - window.innerHeight;
      if (totalScrollable <= 0) return;
      
      const currentScroll = -rect.top;
      const p = Math.max(0, Math.min(1, currentScroll / totalScrollable));
      setScrollProgress(p);

      if (videoRef.current && videoRef.current.duration) {
        targetTime = p * videoRef.current.duration;
      }
    };

    const updateVideoFrame = () => {
      if (videoRef.current && videoRef.current.duration && !videoRef.current.seeking) {
        const diff = targetTime - currentTime;
        currentTime += diff * 0.15; // Smooth lerp
        if (Math.abs(videoRef.current.currentTime - currentTime) > 0.02) {
          videoRef.current.currentTime = currentTime;
        }
      }
      animFrameId = requestAnimationFrame(updateVideoFrame);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    animFrameId = requestAnimationFrame(updateVideoFrame);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  // Sequential Scene Opacities based on scroll progress p (0 -> 1)
  const p = scrollProgress;

  // Scene 1: Hero Intro (p: 0 -> 0.28)
  const s1Opacity = p < 0.20 ? 1 : Math.max(0, 1 - (p - 0.20) / 0.08);

  // Scene 2: Core Philosophy & Modular Pillars (p: 0.32 -> 0.62)
  let s2Opacity = 0;
  if (p >= 0.32 && p < 0.40) {
    s2Opacity = (p - 0.32) / 0.08;
  } else if (p >= 0.40 && p < 0.56) {
    s2Opacity = 1;
  } else if (p >= 0.56 && p < 0.65) {
    s2Opacity = Math.max(0, 1 - (p - 0.56) / 0.09);
  }

  // Scene 3: Interactive SaaS Showcase & CTA (p: 0.68 -> 1.0)
  const s3Opacity = p < 0.68 ? 0 : Math.min(1, (p - 0.68) / 0.08);

  // Text theme flip: Dark Navy (#1D3045) on light cloud frames, White on darker mountain frames
  const isLight = p > 0.55;
  const textColor = isLight ? 'text-white' : 'text-[#1D3045]';
  const subtextColor = isLight ? 'text-slate-200' : 'text-[#1D3045]/85';

  return (
    <div ref={containerRef} className="relative h-[320vh] bg-[#1D3045] w-full">
      {/* Sticky Fullscreen Video Canvas Window */}
      <div className="sticky top-0 w-full h-screen overflow-hidden flex items-center justify-center">
        {/* Background Scroll-Tied Video */}
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* Ambient Subtle Vignette */}
        <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>

        {/* ========================================================================= */}
        {/* SCENE 1: HERO INTRO (p: 0.00 -> 0.28)                                      */}
        {/* ========================================================================= */}
        <div
          style={{ opacity: s1Opacity }}
          className={`absolute inset-0 transition-opacity duration-150 flex flex-col justify-center px-4 sm:px-8 md:px-16 lg:px-24 pt-20 sm:pt-24 ${
            s1Opacity > 0.05 ? 'pointer-events-auto z-20' : 'pointer-events-none z-0'
          }`}
        >
          <div className="max-w-3xl space-y-5 sm:space-y-6">
            {/* Top Badge */}
            <div className="inline-flex items-center space-x-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-white/90 text-[#006B2D] border border-emerald-300 text-xs font-extrabold shadow-sm backdrop-blur-md">
              <Sparkles className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-primary-green animate-pulse" />
              <span>Modern Human Capital & Workforce AI</span>
            </div>

            {/* Main Headline */}
            <h1 className={`text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tight leading-[1.08] ${textColor}`}>
              Advancing resources for a{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-primary-green">
                cleaner future
              </span>
            </h1>

            {/* Subtitle */}
            <p className={`text-sm sm:text-base md:text-lg font-medium leading-relaxed max-w-2xl ${subtextColor}`}>
              Automate modern payroll, GPS attendance, leave approvals, AI video meetings, and agile sprint tracking — in one cohesive, delightfully simple platform.
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4">
              <Link
                to="/signup"
                className="px-7 sm:px-8 py-3.5 sm:py-4 bg-primary-green hover:bg-dark-green text-white font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-emerald-950/20 flex items-center justify-center space-x-2 transition-all hover:scale-105"
              >
                <span>Start Free 14-Day Trial</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <a
                href="#services"
                className="px-6 sm:px-7 py-3.5 sm:py-4 bg-white/90 hover:bg-white text-[#1D3045] font-extrabold text-xs sm:text-sm rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center space-x-2 transition-colors backdrop-blur-md"
              >
                <Play className="h-4 w-4 text-primary-green fill-primary-green" />
                <span>Explore All Products</span>
              </a>
            </div>

            {/* Trust Checklist */}
            <div className="pt-2 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-[#1D3045] font-bold">
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary-green" />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <ShieldCheck className="h-4 w-4 text-primary-green" />
                <span>100% Statutory Compliant</span>
              </div>
            </div>
          </div>

          {/* Bottom-Right Scroll Indicator */}
          <div className="hidden sm:flex absolute bottom-8 sm:bottom-12 right-6 sm:right-12 items-center space-x-3 text-xs font-bold text-[#1D3045] uppercase tracking-widest bg-white/80 px-4 py-2 rounded-full border border-slate-200 shadow-sm backdrop-blur-sm">
            <span>Scroll to Discover</span>
            <div className="h-8 w-8 rounded-full bg-primary-green text-white flex items-center justify-center animate-bounce">
              <ArrowDown className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SCENE 2: CORE PHILOSOPHY & PILLARS (p: 0.32 -> 0.65)                       */}
        {/* ========================================================================= */}
        <div
          style={{ opacity: s2Opacity }}
          className={`absolute inset-0 transition-opacity duration-150 flex flex-col justify-center items-center px-4 sm:px-8 text-center pt-16 sm:pt-20 ${
            s2Opacity > 0.05 ? 'pointer-events-auto z-20' : 'pointer-events-none z-0'
          }`}
        >
          <div className="max-w-4xl space-y-6 sm:space-y-8">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white/90 text-primary-green border border-emerald-200 text-xs font-extrabold uppercase tracking-wider shadow-sm backdrop-blur-md">
              <span>Workforce Intelligence & Precision</span>
            </div>

            <h2 className={`text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extralight tracking-wide leading-[1.25] uppercase ${textColor}`}>
              We build lasting partnerships with vision{' '}
              <span className="font-black text-primary-green">and precision</span> across every frontier
            </h2>

            {/* 3 Modular Feature Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-left max-w-3xl mx-auto pt-2">
              <div className="p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <div className="flex items-center space-x-1.5 text-xs font-black text-[#1D3045]">
                  <DollarSign className="h-4 w-4 text-primary-green" />
                  <span>1-Click Payroll Run</span>
                </div>
                <p className="text-[11px] text-slate-600">Auto gross-to-net calculation with tax compliance.</p>
              </div>

              <div className="p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <div className="flex items-center space-x-1.5 text-xs font-black text-[#1D3045]">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span>Geo GPS Attendance</span>
                </div>
                <p className="text-[11px] text-slate-600">Geo-fenced mobile check-in with live presence.</p>
              </div>

              <div className="p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <div className="flex items-center space-x-1.5 text-xs font-black text-[#1D3045]">
                  <Video className="h-4 w-4 text-purple-600" />
                  <span>AI Video Meetings</span>
                </div>
                <p className="text-[11px] text-slate-600">Live speech-to-text transcripts & instant minutes.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SCENE 3: INTERACTIVE SHOWCASE & ENTERPRISE CTA (p: 0.68 -> 1.00)          */}
        {/* ========================================================================= */}
        <div
          style={{ opacity: s3Opacity }}
          className={`absolute inset-0 transition-opacity duration-150 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 ${
            s3Opacity > 0.05 ? 'pointer-events-auto z-20' : 'pointer-events-none z-0'
          }`}
        >
          <div className="w-full max-w-5xl space-y-6">
            {/* Header */}
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <div className="text-emerald-400 text-xs font-extrabold uppercase tracking-widest">
                The PatternsHR Platform
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight">
                Fueling Ambition, Shaping Tomorrow.
              </h2>
            </div>

            {/* Interactive SaaS Mockup Card */}
            <div className="relative bg-slate-900/95 rounded-3xl border border-white/20 shadow-2xl overflow-hidden backdrop-blur-xl">
              {/* Browser Header */}
              <div className="px-4 sm:px-6 py-3 bg-slate-950/90 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-rose-500"></div>
                  <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                  <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                  <span className="text-xs text-slate-400 font-mono ml-2 hidden md:inline">
                    https://app.patternshr.com
                  </span>
                </div>

                {/* Tab Switcher */}
                <div className="w-full sm:w-auto overflow-x-auto flex items-center space-x-1 bg-white/5 p-1 rounded-xl text-[11px] font-bold border border-white/10 no-scrollbar">
                  <button
                    onClick={() => setActiveTabPreview('payroll')}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex-shrink-0 ${
                      activeTabPreview === 'payroll'
                        ? 'bg-primary-green text-slate-950 shadow-sm font-extrabold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Payroll & Tax
                  </button>

                  <button
                    onClick={() => setActiveTabPreview('attendance')}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex-shrink-0 ${
                      activeTabPreview === 'attendance'
                        ? 'bg-primary-green text-slate-950 shadow-sm font-extrabold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    GPS Attendance
                  </button>

                  <button
                    onClick={() => setActiveTabPreview('meeting')}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex-shrink-0 ${
                      activeTabPreview === 'meeting'
                        ? 'bg-primary-green text-slate-950 shadow-sm font-extrabold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    AI Video Meeting
                  </button>
                </div>
              </div>

              {/* Tab 1: Payroll */}
              {activeTabPreview === 'payroll' && (
                <div className="p-4 sm:p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-8 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 gap-2">
                      <div>
                        <div className="text-xs font-extrabold text-white">August 2026 Salary Disbursement</div>
                        <div className="text-[11px] text-slate-400">Auto-calculated with tax formulas & leaves</div>
                      </div>
                      <span className="w-fit px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold">
                        ✓ Ready to Process
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Net Salaries</div>
                        <div className="text-xl sm:text-2xl font-black text-white">$142,850.00</div>
                        <div className="text-[10px] text-emerald-400 font-semibold">126 Employees</div>
                      </div>

                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Tax Deductions</div>
                        <div className="text-xl sm:text-2xl font-black text-slate-300">$24,190.00</div>
                        <div className="text-[10px] text-slate-400 font-semibold">Automated W-2 / PF</div>
                      </div>

                      <div className="p-4 bg-emerald-950/40 rounded-2xl border border-emerald-500/30 space-y-1">
                        <div className="text-[10px] text-emerald-300 font-bold uppercase">Time Saved</div>
                        <div className="text-xl sm:text-2xl font-black text-primary-green">3.8 Days</div>
                        <div className="text-[10px] text-emerald-400 font-semibold">Zero manual entry</div>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-4 bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3 text-xs">
                    <div className="font-extrabold text-white flex items-center space-x-1.5">
                      <CheckCircle className="h-4 w-4 text-primary-green" />
                      <span>Statutory Compliance</span>
                    </div>
                    <ul className="space-y-2 text-[11px] text-slate-300">
                      <li>• Direct bank transfer generation</li>
                      <li>• One-click PDF payslip delivery</li>
                      <li>• Configurable bonuses & allowances</li>
                    </ul>
                    <div className="pt-2">
                      <Link
                        to="/signup"
                        className="block w-full py-2.5 bg-primary-green hover:bg-emerald-400 text-slate-950 text-center rounded-xl font-bold text-xs shadow-sm transition-colors"
                      >
                        Run Payroll in 1 Click
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Attendance */}
              {activeTabPreview === 'attendance' && (
                <div className="p-4 sm:p-6 md:p-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                    <div className="text-xs text-slate-400 font-bold uppercase">Checked In Today</div>
                    <div className="text-3xl font-black text-primary-green">98.4%</div>
                    <p className="text-xs text-slate-300">124 of 126 active employees on duty</p>
                  </div>

                  <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                    <div className="text-xs text-slate-400 font-bold uppercase">GPS Geo-Fenced Check-in</div>
                    <div className="text-3xl font-black text-sky-400">100% Verified</div>
                    <p className="text-xs text-slate-300">Office coordinates & IP validation</p>
                  </div>

                  <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                    <div className="text-xs text-slate-400 font-bold uppercase">Automated Overtime</div>
                    <div className="text-3xl font-black text-amber-400">8.2 hrs/avg</div>
                    <p className="text-xs text-slate-300">Directly syncs to monthly payroll</p>
                  </div>
                </div>
              )}

              {/* Tab 3: Meeting */}
              {activeTabPreview === 'meeting' && (
                <div className="p-4 sm:p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-8 bg-black/60 rounded-2xl p-6 text-white space-y-3 border border-white/10">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span className="font-bold">Team Sprint Planning Call</span>
                      <span className="flex items-center space-x-1 text-primary-green font-bold">
                        <Mic className="h-3.5 w-3.5" />
                        <span>Live Speech-to-Text</span>
                      </span>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl text-xs text-slate-200 border border-white/10">
                      &ldquo;Let&apos;s approve the new UI updates and assign the sprint backlog tickets.&rdquo;
                    </div>
                  </div>

                  <div className="md:col-span-4 bg-emerald-950/40 p-4 rounded-2xl border border-emerald-500/30 space-y-2 text-xs">
                    <div className="font-extrabold text-emerald-300 flex items-center space-x-1.5">
                      <Sparkles className="h-4 w-4 text-emerald-400" />
                      <span>Instant AI Action Item</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Assigned 4 sprint tickets directly to Jira & Sprint Board with zero manual copying.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Row CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="text-xs text-slate-400 text-center sm:text-left">
                Trusted by 500+ enterprises, remote teams, and tech startups worldwide.
              </div>
              <Link
                to="/signup"
                className="w-full sm:w-auto px-8 py-3.5 bg-primary-green hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg flex items-center justify-center space-x-2 transition-all hover:scale-105"
              >
                <span>Get Started Free</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

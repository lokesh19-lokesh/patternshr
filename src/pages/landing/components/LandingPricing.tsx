import React from 'react';
import { Play, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const PRICING_VIDEO_URL = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260725_114042_d2ed2a89-f2fa-449b-9609-da456344257b.mp4';

export const LandingPricing: React.FC = () => {
  return (
    <section 
      id="pricing" 
      className="relative min-h-screen w-full overflow-hidden bg-black text-white py-16 sm:py-20 flex flex-col justify-between"
    >
      {/* Background Video (Scaled on Large Screens) */}
      <video
        src={PRICING_VIDEO_URL}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover lg:scale-[1.2] opacity-80 pointer-events-none z-0"
      />

      {/* Subtle Overlay to ensure high readability */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none z-0"></div>

      {/* Main Content (Z-10) */}
      <div className="relative z-10 flex h-full flex-col px-5 sm:px-6 md:px-10 lg:px-14 max-w-7xl mx-auto w-full flex-1 justify-between space-y-12">
        
        {/* ========================================================================= */}
        {/* 1. FOUR-COLUMN META GRID                                                  */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 pt-4">
          
          {/* COL 1: Starter Plan */}
          <div className="space-y-1">
            <h2 className="text-lg md:text-xl tracking-wide leading-tight font-normal text-white">
              <div>STARTER</div>
              <div className="font-pixel text-2xl md:text-3xl text-emerald-400">FREE FOREVER</div>
            </h2>
            <div className="text-[10px] text-white/50 pt-2">*</div>
            <p className="font-pixel text-xs text-white/70 leading-relaxed max-w-[220px]">
              PatternsHR free tier is built<br />
              for early-stage startups and<br />
              teams up to 10 employees<br />
              with zero credit card
            </p>
          </div>

          {/* COL 2: Growth & Pro */}
          <div className="text-right lg:text-left space-y-1">
            <h2 className="text-lg md:text-xl tracking-wide leading-tight font-normal text-white">
              <div>GROWTH &</div>
              <div className="font-pixel text-2xl md:text-3xl text-emerald-400">AI PRO</div>
            </h2>
            <div className="text-[10px] text-white/50 pt-2">*</div>
            <p className="font-pixel text-xs text-white/70 leading-relaxed max-w-[220px] ml-auto lg:ml-0">
              $5 / user / month<br />
              Automated payroll, agile sprints,<br />
              real-time AI transcripts &amp;<br />
              unlimited company headcount
            </p>
          </div>

          {/* COL 3: What We Do */}
          <div className="space-y-2">
            <div className="font-pixel text-base tracking-widest text-white/60 uppercase">
              What We Automate
            </div>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed max-w-[240px]">
              We automate 100% of statutory payroll, biometric GPS attendance, and real-time AI meeting minutes for modern companies.
            </p>
          </div>

          {/* COL 4: Services Included */}
          <div className="text-right lg:text-left space-y-2">
            <div className="font-pixel text-base tracking-widest text-white/60 uppercase">
              Included Modules
            </div>
            <ul className="text-xs sm:text-sm text-white/90 leading-relaxed space-y-0.5">
              <li>1-Click Payroll &amp; Tax Engine</li>
              <li>Real-Time AI Video Meeting Minutes</li>
              <li>Geo-Fenced GPS Attendance</li>
              <li>Agile Sprint &amp; Task Velocity</li>
              <li>Encrypted Document Cloud</li>
              <li>Priority 24/7 Dedicated Support</li>
            </ul>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* 2. FLEX SPACER                                                            */}
        {/* ========================================================================= */}
        <div className="flex-1 min-h-[40px] sm:min-h-[80px]" />

        {/* ========================================================================= */}
        {/* 3. BOTTOM SECTION (Headline + Showreel CTA + Proof Chips + Footer Strip) */}
        {/* ========================================================================= */}
        <div className="space-y-6 pb-2">
          
          {/* ROW A: Headline + Action Buttons */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            
            {/* Left Headline */}
            <div className="lg:col-span-7">
              <h1 
                className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] xl:text-[4rem] tracking-wide uppercase font-normal text-white"
                style={{ lineHeight: 0.95 }}
              >
                PLANS BUILT FOR<br />
                <span className="font-pixel text-[1.25em] text-emerald-400 inline-block leading-none align-baseline">
                  ACCELERATED
                </span><br />
                WORKFORCE<br />
                <span className="font-pixel text-[1.25em] text-white inline-block leading-none align-baseline">
                  INTELLIGENCE
                </span>
              </h1>
            </div>

            {/* Right Column: CTA & Badges */}
            <div className="lg:col-span-5 flex flex-col gap-4 sm:gap-6 justify-end lg:items-end">
              
              {/* Action Button */}
              <Link
                to="/signup"
                className="self-start lg:self-end flex items-center gap-3 border border-white/30 px-6 py-3.5 backdrop-blur-sm bg-white/10 hover:bg-white/20 transition-all rounded-xl shadow-2xl group"
              >
                <div className="h-6 w-6 rounded-full bg-primary-green flex items-center justify-center">
                  <Play size={12} fill="#000" className="text-black ml-0.5" />
                </div>
                <span className="text-xs sm:text-sm tracking-wider font-extrabold text-white">
                  START 14-DAY FREE TRIAL
                </span>
                <ArrowRight size={14} className="text-emerald-400 group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* Awards / Trust Chips */}
              <div className="flex flex-wrap items-stretch gap-2 sm:gap-3 text-xs sm:text-sm text-white/90 self-start lg:self-end">
                <div className="bg-[#0B0B0B]/90 px-3 sm:px-4 py-2 rounded-xl flex items-center gap-2 border border-white/10">
                  <span className="font-bold text-xs sm:text-sm tracking-tight text-emerald-400">SOC-2</span>
                  <span className="text-white/50 text-[10px]">CERTIFIED</span>
                </div>

                <div className="bg-[#0B0B0B]/90 px-3 sm:px-4 py-2 rounded-xl flex items-center gap-2 border border-white/10">
                  <span className="font-bold text-sm sm:text-base text-white">99.99%</span>
                  <span className="text-white/50 text-[10px]">UPTIME</span>
                </div>

                <div className="bg-[#0B0B0B]/90 px-3 sm:px-4 py-2 rounded-xl flex items-center gap-2 border border-white/10">
                  <span className="font-bold text-xs sm:text-sm tracking-tight text-emerald-400">1-CLICK</span>
                  <span className="text-white/50 text-[10px]">PAYROLL</span>
                </div>
              </div>

            </div>

          </div>

          {/* ROW B: Footer Strip */}
          <div className="mt-4 border-t border-white/15 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs text-white/60">
            <div>
              14-day free trial on all paid plans. No credit card required.{' '}
              <Link to="/signup" className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors">
                Start Free Trial &rarr;
              </Link>
            </div>
            <div className="sm:text-right font-mono text-[11px] text-white/50">
              500+ Active Companies &bull; 99.99% WebRTC Video &bull; 100% Tax Compliant
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

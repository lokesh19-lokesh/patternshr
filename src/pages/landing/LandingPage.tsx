import React, { useEffect } from 'react';
import { LandingNavbar } from './components/LandingNavbar';
import { LandingHero } from './components/LandingHero';
import { LandingServices } from './components/LandingServices';
import { LandingFeatureTabs } from './components/LandingFeatureTabs';
import { LandingComparison } from './components/LandingComparison';
import { LandingTestimonials } from './components/LandingTestimonials';
import { LandingRoiCalculator } from './components/LandingRoiCalculator';
import { LandingSecurity } from './components/LandingSecurity';
import { LandingPricing } from './components/LandingPricing';
import { LandingFaq } from './components/LandingFaq';
import { LandingCta } from './components/LandingCta';
import { LandingFooter } from './components/LandingFooter';

export const LandingPage: React.FC = () => {
  useEffect(() => {
    // Set page title for SEO and branding (Keka style)
    document.title = 'PatternsHR - Modern HR, Payroll & AI Workforce Software';
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-primary-green selection:text-white">
      {/* 1. Keka-Style Navigation Bar */}
      <LandingNavbar />

      {/* 2. Hero Section with Live Interactive Preview */}
      <LandingHero />

      {/* 3. Comprehensive Breakdown of All 8 Core Product Suites */}
      <LandingServices />

      {/* 4. Interactive Feature Tour (Meetings, Attendance, Sprints, Payroll) */}
      <LandingFeatureTabs />

      {/* 5. Why Leading Companies Switch to PatternsHR (Comparison Matrix) */}
      <LandingComparison />

      {/* 6. Customer Success Stories & Testimonials */}
      <LandingTestimonials />

      {/* 7. Team ROI & Productivity Savings Calculator */}
      <LandingRoiCalculator />

      {/* 8. Bank-Grade Enterprise Security & Multi-Tenant Compliance */}
      <LandingSecurity />

      {/* 9. Simple, Transparent Pricing Plans */}
      <LandingPricing />

      {/* 10. Frequently Asked Questions */}
      <LandingFaq />

      {/* 11. Pre-Footer Conversion Call to Action */}
      <LandingCta />

      {/* 12. Mega Footer */}
      <LandingFooter />
    </div>
  );
};

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="bg-[#111315] text-gray-400 border-t border-white/10 text-xs font-medium">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Col */}
          <div className="col-span-2 space-y-4">
            <Link to="/" className="inline-block group">
              <div className="bg-white px-4 py-2 rounded-2xl shadow-md border border-white/20 group-hover:scale-105 transition-transform inline-flex items-center">
                <img
                  src="/logo.png"
                  alt="The Patterns Company HR"
                  className="h-10 sm:h-12 w-auto max-h-12 object-contain"
                />
              </div>
            </Link>

            <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
              The all-in-one workforce intelligence & enterprise HR platform. Unifying WebRTC AI video meetings, geo-fenced attendance, agile sprint velocity, and automated payroll into one intuitive workspace.
            </p>

            <div className="flex items-center space-x-2 text-[11px] text-emerald-400">
              <ShieldCheck className="h-4 w-4 text-primary-green" />
              <span>SOC-2 & GDPR Enterprise Certified</span>
            </div>
          </div>

          {/* Col 1: Platform & Services */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Services</h4>
            <ul className="space-y-2">
              <li>
                <a href="#meetings" className="hover:text-primary-green transition-colors">
                  AI Video Meetings
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-primary-green transition-colors">
                  Smart Attendance & GPS
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-primary-green transition-colors">
                  Leave & Time-Off
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-primary-green transition-colors">
                  Agile Sprint Boards
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-primary-green transition-colors">
                  1-Click Payroll & Tax
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-primary-green transition-colors">
                  Document Cloud Vault
                </a>
              </li>
            </ul>
          </div>

          {/* Col 2: Solutions by Role */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Solutions</h4>
            <ul className="space-y-2">
              <li>
                <a href="#features" className="hover:text-primary-green transition-colors">
                  For HR Leaders & People Ops
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-primary-green transition-colors">
                  For Engineering & Product
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-primary-green transition-colors">
                  For Founders & Executives
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-primary-green transition-colors">
                  For Remote & Hybrid Teams
                </a>
              </li>
              <li>
                <a href="#calculator" className="hover:text-primary-green transition-colors">
                  Productivity ROI Calculator
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Company & Trust */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Company</h4>
            <ul className="space-y-2">
              <li>
                <a href="https://thepatternscompany.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary-green transition-colors">
                  About The Patterns Company
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-primary-green transition-colors">
                  Pricing Plans
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-primary-green transition-colors">
                  Knowledge Base & FAQ
                </a>
              </li>
              <li>
                <Link to="/login" className="hover:text-primary-green transition-colors">
                  Customer Portal Sign In
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-primary-green transition-colors">
                  Create Workspace
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-500">
          <div className="flex items-center space-x-1">
            <span>&copy; {new Date().getFullYear()} The Patterns Company. All rights reserved.</span>
          </div>

          <div className="flex items-center space-x-6">
            <span className="hover:text-gray-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-gray-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-gray-400 cursor-pointer">Security Whitepaper</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

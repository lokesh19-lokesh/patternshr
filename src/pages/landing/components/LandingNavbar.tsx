import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Menu, 
  X, 
  Sparkles, 
  Video, 
  ArrowRight,
  ChevronDown
} from 'lucide-react';

export const LandingNavbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-md py-4 sm:py-5'
          : 'bg-white/90 backdrop-blur-sm border-b border-slate-100 py-5 sm:py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center group">
          <img
            src="/logo.png"
            alt="The Patterns Company HR"
            className="h-12 sm:h-14 md:h-16 w-auto max-h-16 object-contain transition-transform group-hover:scale-105"
          />
        </Link>

        {/* Desktop Navigation Links (Keka Style) */}
        <nav className="hidden md:flex items-center space-x-7 text-xs font-bold text-slate-700">
          <a
            href="#services"
            className="hover:text-primary-green transition-colors flex items-center space-x-1"
          >
            <span>Products</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </a>

          <a
            href="#meetings"
            className="hover:text-primary-green transition-colors flex items-center space-x-1"
          >
            <Video className="h-3.5 w-3.5 text-primary-green" />
            <span>AI Video Meetings</span>
          </a>

          <a
            href="#features"
            className="hover:text-primary-green transition-colors"
          >
            Tour
          </a>

          <a
            href="#comparison"
            className="hover:text-primary-green transition-colors"
          >
            Why PatternsHR
          </a>

          <a
            href="#calculator"
            className="hover:text-primary-green transition-colors"
          >
            ROI Calculator
          </a>

          <a
            href="#pricing"
            className="hover:text-primary-green transition-colors"
          >
            Pricing
          </a>
        </nav>

        {/* Action Buttons */}
        <div className="hidden sm:flex items-center space-x-3 text-xs font-bold">
          <Link
            to="/login"
            className="px-4 py-2.5 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-xl transition-all font-bold"
          >
            Log In
          </Link>

          <Link
            to="/signup"
            className="px-5 py-2.5 bg-primary-green hover:bg-dark-green text-white rounded-xl shadow-md flex items-center space-x-1.5 transition-all hover:scale-105 font-extrabold"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Start Free Trial</span>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 animate-fade-in text-sm font-bold text-slate-800 shadow-xl">
          <a
            href="#services"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 hover:text-primary-green"
          >
            Products & Suites
          </a>
          <a
            href="#meetings"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 hover:text-primary-green"
          >
            AI Video Meetings
          </a>
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 hover:text-primary-green"
          >
            Tour
          </a>
          <a
            href="#comparison"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 hover:text-primary-green"
          >
            Why PatternsHR
          </a>
          <a
            href="#calculator"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 hover:text-primary-green"
          >
            ROI Calculator
          </a>
          <a
            href="#pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 hover:text-primary-green"
          >
            Pricing
          </a>

          <div className="pt-4 border-t border-slate-100 flex flex-col space-y-2">
            <Link
              to="/login"
              className="w-full py-2.5 text-center text-slate-700 hover:bg-slate-50 rounded-xl"
            >
              Log In
            </Link>
            <Link
              to="/signup"
              className="w-full py-3 text-center bg-primary-green text-white font-black rounded-xl shadow-md flex items-center justify-center space-x-1.5"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

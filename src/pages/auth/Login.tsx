import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '../../lib/supabase/client';
import { useNavigate, Link, useLocation } from 'react-router-dom';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      navigate(from, { replace: true });
    }
  };

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-black text-white font-['Readex_Pro',sans-serif]">
      {/* 1. Background Video */}
      <video
        className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none"
        autoPlay
        loop
        muted
        playsInline
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_063509_7d167302-4fd4-480b-8260-18ab572333d4.mp4"
      />

      {/* 2. Main Two-Column Container */}
      <div className="relative z-20 flex min-h-screen flex-col lg:flex-row items-center justify-between">
        {/* Left Hero Section (Desktop & Tablet) */}
        <div className="hidden lg:flex lg:w-[56%] xl:w-[60%] min-h-screen flex-col justify-between p-10 xl:p-14 relative pointer-events-none select-none">
          {/* Top Row: Stat */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 bg-neutral-900/80 backdrop-blur rounded-full px-4 py-2 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-white text-xs font-normal tracking-tight">Enterprise Data Security</span>
            </div>

            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2.5">
                <span className="h-px w-16 bg-white/40 rotate-[20deg]"></span>
                <span className="text-3xl xl:text-4xl font-medium tracking-tight text-white">+65k</span>
              </div>
              <span className="text-xs text-white/70 mt-0.5">startups use</span>
            </div>
          </div>

          {/* Center: Giant Staggered Typography */}
          <div className="relative my-auto py-10">
            <h1 className="hero-title text-white/95 font-medium text-[8.5vw] xl:text-[7.5vw] lowercase leading-none tracking-tighter">
              protect
            </h1>
            <h1 className="hero-title text-white/95 font-medium text-[8.5vw] xl:text-[7.5vw] lowercase leading-none tracking-tighter ml-[18%]">
              your
            </h1>
            <h1 className="hero-title text-white/95 font-medium text-[8.5vw] xl:text-[7.5vw] lowercase leading-none tracking-tighter ml-[8%]">
              data
            </h1>

            {/* Description quote */}
            <p className="max-w-[280px] text-sm leading-relaxed text-white/80 font-light mt-6 ml-2">
              we can guarding your data with utmost care, empowering you with privacy everywhere
            </p>
          </div>

          {/* Bottom Row: 2 Stats */}
          <div className="flex items-end justify-between w-full pt-6">
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl xl:text-3xl font-medium tracking-tight text-white">+1.5b</span>
                <span className="h-px w-16 bg-white/40 rotate-[-20deg]"></span>
              </div>
              <span className="text-xs text-white/70 mt-0.5">gb data was protected</span>
            </div>

            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2.5">
                <span className="h-px w-16 bg-white/40 rotate-[-20deg]"></span>
                <span className="text-2xl xl:text-3xl font-medium tracking-tight text-white">+300k</span>
              </div>
              <span className="text-xs text-white/70 mt-0.5">downloads</span>
            </div>
          </div>
        </div>

        {/* Right Section: Form Card */}
        <div className="w-full lg:w-[44%] xl:w-[40%] flex items-center justify-center p-4 sm:p-8 lg:p-12 min-h-screen">
          <div className="w-full max-w-md space-y-7 bg-white p-8 sm:p-10 rounded-3xl shadow-2xl border border-gray-100 text-gray-900">
            <div className="text-center">
              <img
                src="/logo.png"
                alt="Patterns HR"
                className="h-20 sm:h-24 w-auto max-w-[260px] mx-auto object-contain mb-4"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <h2 className="text-center text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                Sign in to your account
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Or{' '}
                <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                  create a new company account
                </Link>
              </p>
            </div>

            <form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)}>
              {error && (
                <div className="rounded-xl bg-red-50 p-3.5 text-xs text-red-700 border border-red-200">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    {...register('email')}
                    className="block w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm transition-all"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Password
                    </label>
                    <Link to="/forgot-password" className="text-xs font-medium text-blue-600 hover:text-blue-500">
                      Forgot password?
                    </Link>
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...register('password')}
                    className="block w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm transition-all"
                  />
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all disabled:opacity-50 shadow-md hover:shadow-lg mt-2"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Gradient overlay */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-b from-transparent to-black/80 z-10"></div>
    </section>
  );
};

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from "wouter";
import API from "../api/auth";
import { Leaf, Eye, EyeOff, Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';

const PERKS = [
  { emoji: '🥗', text: 'AI-generated meal plans tailored to you' },
  { emoji: '📦', text: 'Smart pantry that tracks expiry dates' },
  { emoji: '🛒', text: 'Auto grocery lists — buy only what you need' },
  { emoji: '📊', text: 'Daily nutrition & macro tracking' },
];

export default function Signup() {

  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function update(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

const handleSignup = async (e) => {
  e.preventDefault();

  setLoading(true);
  setError("");

  try {
    const res = await API.post("/register", {
      name: form.name,
      email: form.email,
      password: form.password,
    });

    alert(res.data.message);

    // Clear form
    setForm({
      name: "",
      email: "",
      password: "",
    });

    // Navigate to login
    navigate("/login");
    // If using React Router:
    // navigate("/login");

  } catch (err) {
    console.log(err.response);

    setError(
      err.response?.data?.message || "Registration Failed"
    );
  } finally {
    setLoading(false);
  }
};

  const strength = form.password.length === 0 ? 0
    : form.password.length < 6 ? 1
    : form.password.length < 10 ? 2
    : 3;
  const strengthLabel = ['', 'Weak', 'Good', 'Strong'];
  const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-primary'];

  

  return (
    <div className="min-h-screen flex">

      {/* ── Left: Brand Panel ───────────────────────────── */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-emerald-600 via-green-600 to-green-500 flex-col justify-between p-16 relative overflow-hidden">

        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-black/10" />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2"
        >
          <div className="bg-white/20 p-2 rounded-xl">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black text-white tracking-tight">
            MealMate <span className="text-green-200">AI</span>
          </span>
        </motion.div>

        {/* Center */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative z-10"
        >
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-4 py-2 mb-8">
            <Sparkles className="w-4 h-4 text-green-200" />
            <span className="text-white text-sm font-medium">Free 14-day premium trial</span>
          </div>

          <h2 className="text-5xl font-black text-white leading-tight mb-4">
            Start eating<br />
            <span className="text-green-200">healthier today.</span>
          </h2>
          <p className="text-green-100 text-lg mb-10 max-w-sm leading-relaxed">
            Join 20,000+ people transforming how they eat, plan, and shop — for free.
          </p>

          <div className="grid grid-cols-1 gap-4">
            {PERKS.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-3 bg-white/10 border border-white/15 rounded-xl px-4 py-3"
              >
                <span className="text-xl">{p.emoji}</span>
                <span className="text-green-50 text-sm">{p.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom stat row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex items-center gap-8 relative z-10"
        >
          {[['50K+', 'Recipes'], ['20K+', 'Users'], ['4.9★', 'Rating']].map(([val, label]) => (
            <div key={label}>
              <p className="text-2xl font-black text-white">{val}</p>
              <p className="text-green-200 text-xs font-medium">{label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Right: Form Panel ────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md mx-auto"
        >
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden inline-flex items-center gap-2 mb-8">
            <div className="bg-primary/10 p-2 rounded-xl">
              <Leaf className="w-5 h-5 text-primary" />
            </div>
            <span className="text-lg font-black text-gray-900">
              MealMate <span className="text-primary">AI</span>
            </span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-gray-900 mb-2">Create your account</h1>
            <p className="text-gray-500">Free forever. No credit card required.</p>
          </div>

          {/* Google */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign up with Google
          </button>

          <div className="relative flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">OR</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleSignup} className="space-y-4">

            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={form.name}
                  onChange={update('name')}
                  placeholder="Alex Johnson"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={update('email')}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={update('password')}
                  placeholder="Min. 8 characters"
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength */}
              {form.password.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3].map((s) => (
                      <div
                        key={s}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          strength >= s ? strengthColor[strength] : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`text-xs font-semibold ${
                    strength === 1 ? 'text-red-500' : strength === 2 ? 'text-amber-500' : 'text-primary'
                  }`}>
                    {strengthLabel[strength]}
                  </span>
                </div>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setAgreed(!agreed)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                  agreed ? 'bg-primary border-primary' : 'border-gray-300 bg-white hover:border-primary/50'
                }`}
              >
                {agreed && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5"/></svg>}
              </button>
              <span className="text-sm text-gray-600">
                I agree to the{' '}
                <a href="#" className="text-primary font-semibold hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-primary font-semibold hover:underline">Privacy Policy</a>
              </span>
            </div>

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
              >
                {error}
              </motion.p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Creating account…
                </>
              ) : (
                <>
                  Create Free Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/Login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
              Sign in →
            </Link>
          </p>
        </motion.div>
      </div>

    </div>
  );
}

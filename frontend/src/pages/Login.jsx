import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import axios from "axios";
import { Leaf, Eye, EyeOff, Mail, Lock, ArrowRight, CheckCircle } from 'lucide-react';

const BENEFITS = [
  'Personalized AI meal plans every week',
  'Smart pantry & expiry tracking',
  'Auto-generated grocery lists',
  'Nutrition tracking & macro goals',
];

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {

    e.preventDefault();

    setError("");

    if (!email || !password) {

      setError("Please fill in all fields.");

      return;

    }

    try {

      setLoading(true);

      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email,
          password,
        }
      );

      localStorage.setItem("token", res.data.token);

      alert("Login Successful");

    }
    catch (err) {

      setError(

        err.response?.data?.message ||

        "Login Failed"

      );

    }
    finally {

      setLoading(false);

    }

  }



  return (
    <div className="min-h-screen flex">

      {/* ── Left: Form Panel ─────────────────────────────── */ }
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12 bg-white">
        <motion.div
          initial={ { opacity: 0, y: 24 } }
          animate={ { opacity: 1, y: 0 } }
          transition={ { duration: 0.5 } }
          className="w-full max-w-md mx-auto"
        >
          {/* Logo */ }
          <Link href="/" className="inline-flex items-center gap-2 mb-10 group">
            <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
              <Leaf className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xl font-black text-gray-900 tracking-tight">
              MealMate <span className="text-primary">AI</span>
            </span>
          </Link>

          {/* Heading */ }
          <div className="mb-8">
            <h1 className="text-3xl font-black text-gray-900 mb-2">Welcome back</h1>
            <p className="text-gray-500">Login to continue your healthy journey.</p>
          </div>

          {/* Google SSO Button */ }
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          {/* Divider */ }
          <div className="relative flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">OR</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Form */ }
          <form onSubmit={ handleSubmit } className="space-y-5">

            {/* Email */ }
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={ email }
                  onChange={ (e) => setEmail(e.target.value) }
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */ }
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-gray-700">
                  Password
                </label>
                <a href="#" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={ showPassword ? 'text' : 'password' }
                  value={ password }
                  onChange={ (e) => setPassword(e.target.value) }
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={ () => setShowPassword(!showPassword) }
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  { showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" /> }
                </button>
              </div>
            </div>

            {/* Remember me */ }
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={ () => setRemember(!remember) }
                className={ `w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${remember ? 'bg-primary border-primary' : 'border-gray-300 bg-white hover:border-primary/50'
                  }` }
              >
                { remember && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" /></svg> }
              </button>
              <span className="text-sm text-gray-600 select-none cursor-pointer" onClick={ () => setRemember(!remember) }>
                Remember me for 30 days
              </span>
            </div>

            {/* Error */ }
            { error && (
              <motion.p
                initial={ { opacity: 0, y: -4 } }
                animate={ { opacity: 1, y: 0 } }
                className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
              >
                { error }
              </motion.p>
            ) }

            {/* Submit */ }
            <button
              type="submit"
              disabled={ loading }
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              { loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Loging in…
                </>
              ) : (
                <>
                  Login
                  <ArrowRight className="w-4 h-4" />
                </>
              ) }
            </button>
          </form>

          {/* Sign up link */ }
          <p className="mt-8 text-center text-sm text-gray-500">
            Don't have an account?{ ' ' }
            <Link href="/signup" className="font-semibold text-primary hover:text-primary/80 transition-colors">
              Create one free →
            </Link>
          </p>
        </motion.div>
      </div>

      {/* ── Right: Brand Panel ───────────────────────────── */ }
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-green-500 via-green-600 to-emerald-700 flex-col justify-between p-16 relative overflow-hidden">

        {/* Background circles */ }
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-black/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/3" />

        {/* Top badge */ }
        <motion.div
          initial={ { opacity: 0, y: -20 } }
          animate={ { opacity: 1, y: 0 } }
          transition={ { duration: 0.6, delay: 0.2 } }
          className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 w-fit"
        >
          <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
          <span className="text-white text-sm font-medium">20,000+ active users</span>
        </motion.div>

        {/* Center content */ }
        <motion.div
          initial={ { opacity: 0, y: 20 } }
          animate={ { opacity: 1, y: 0 } }
          transition={ { duration: 0.7, delay: 0.3 } }
          className="relative z-10"
        >
          <h2 className="text-5xl font-black text-white leading-tight mb-6">
            Your kitchen,<br />
            <span className="text-green-200">smarter.</span>
          </h2>
          <p className="text-green-100 text-lg mb-10 max-w-sm leading-relaxed">
            Plan meals, track nutrition, and reduce food waste — all powered by AI that learns your taste.
          </p>

          {/* Benefits list */ }
          <ul className="space-y-4">
            { BENEFITS.map((b, i) => (
              <motion.li
                key={ i }
                initial={ { opacity: 0, x: -20 } }
                animate={ { opacity: 1, x: 0 } }
                transition={ { duration: 0.4, delay: 0.5 + i * 0.1 } }
                className="flex items-center gap-3 text-green-50 text-sm"
              >
                <CheckCircle className="w-5 h-5 text-green-300 shrink-0" />
                { b }
              </motion.li>
            )) }
          </ul>
        </motion.div>

        {/* Bottom testimonial card */ }
        <motion.div
          initial={ { opacity: 0, y: 20 } }
          animate={ { opacity: 1, y: 0 } }
          transition={ { duration: 0.6, delay: 0.8 } }
          className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 relative z-10"
        >
          <div className="flex items-center gap-1 mb-3">
            { [1, 2, 3, 4, 5].map(s => (
              <svg key={ s } className="w-4 h-4 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            )) }
          </div>
          <p className="text-white/90 text-sm leading-relaxed mb-4 italic">
            "MealMate AI saves me 3 hours a week on meal planning. The AI suggestions are surprisingly good!"
          </p>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
              SJ
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Sarah Johnson</p>
              <p className="text-green-200 text-xs">Home Chef & Mom</p>
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from "wouter";
import API from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { ChefHat, Eye, EyeOff, Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';

const PERKS = [
  { emoji: '🥗', text: 'AI-generated meal plans tailored to you' },
  { emoji: '📦', text: 'Smart pantry that tracks expiry dates' },
  { emoji: '🛒', text: 'Auto grocery lists — buy only what you need' },
  { emoji: '📊', text: 'Daily nutrition & macro tracking' },
];

export default function Signup() {

  const [, navigate] = useLocation();
  const { login } = useAuth();
  const googleButtonRef = useRef(null);
  const loginRef = useRef(login);

  useEffect(() => {
    loginRef.current = login;
  }, [login]);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError("Google sign-up is not configured. Please use email registration or contact the administrator.");
      return undefined;
    }

    let cancelled = false;
    let script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    let addedScript = false;

    const initializeGoogle = () => {
      if (cancelled || !window.google?.accounts?.id || !googleButtonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          if (!credential) {
            setError("Google did not return an authentication credential. Please try again.");
            return;
          }
          try {
            setLoading(true);
            setError("");
            const response = await API.post("/google", { credential });
            loginRef.current(response.data.user, response.data.token);
            navigate("/dashboard");
          } catch (err) {
            setError(err.response?.data?.message || "Google registration failed. Please try again.");
          } finally {
            setLoading(false);
          }
        },
      });

      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "continue_with",
        logo_alignment: "center",
        width: Math.min(400, googleButtonRef.current.parentElement?.clientWidth || 400),
      });
    };

    const handleScriptError = () => {
      if (!cancelled) setError("Google sign-in could not load. Check your internet connection and try again.");
    };

    if (window.google?.accounts?.id) {
      initializeGoogle();
    } else {
      if (!script) {
        script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
        addedScript = true;
      }
      script.addEventListener("load", initializeGoogle);
      script.addEventListener("error", handleScriptError);
    }

    return () => {
      cancelled = true;
      if (script) {
        script.removeEventListener("load", initializeGoogle);
        script.removeEventListener("error", handleScriptError);
      }
      if (addedScript && script?.parentNode) script.parentNode.removeChild(script);
    };
  }, [navigate]);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stats")
      .then((response) => {
        if (!response.ok) throw new Error("Statistics request failed");
        return response.json();
      })
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((err) => console.error("Unable to load public MealMate statistics:", err));
    return () => { cancelled = true; };
  }, []);

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
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black text-white tracking-tight">
            MealMate
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
            <span className="text-white text-sm font-medium">Your healthy routine starts here</span>
          </div>

          <h2 className="text-5xl font-black text-white leading-tight mb-4">
            Start eating<br />
            <span className="text-green-200">healthier today.</span>
          </h2>
          <p className="text-green-100 text-lg mb-10 max-w-sm leading-relaxed">
            Plan meals, track nutrition, and make grocery shopping simpler with MealMate.
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

        {/* Live statistics loaded from MongoDB through /api/stats. */}
        {stats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-8 relative z-10"
          >
            {[
              { value: stats.recipes, label: "Recipes" },
              { value: stats.registeredUsers, label: "Registered Users" },
              ...(stats.averageRecipeRating != null && Number(stats.recipeRatingCount) > 0
                ? [{ value: `${stats.averageRecipeRating}/5`, label: "Recipe Rating" }]
                : []),
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-2xl font-black text-white">{Number.isFinite(Number(value)) ? Number(value).toLocaleString() : value}</p>
                <p className="text-green-200 text-xs font-medium">{label}</p>
              </div>
            ))}
          </motion.div>
        )}
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
              <ChefHat className="w-5 h-5 text-primary" />
            </div>
            <span className="text-lg font-black text-gray-900">
              MealMate
            </span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-gray-900 mb-2">Create your account</h1>
            <p className="text-gray-500">Free forever. No credit card required.</p>
          </div>

          {/* Google Identity Services renders Google's secure sign-in button here. */}
          <div className="w-full flex justify-center mb-6">
            <div ref={googleButtonRef} aria-label="Continue with Google" />
          </div>

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

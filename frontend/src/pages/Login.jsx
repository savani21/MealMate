import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import axios from "axios";
import { ChefHat, Eye, EyeOff, Mail, Lock, ArrowRight, CheckCircle } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';

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
  const [showForgot,setShowForgot]=useState(false);
  const [forgotEmail,setForgotEmail]=useState('');
  const [forgotMessage,setForgotMessage]=useState('');
  const [forgotLoading,setForgotLoading]=useState(false);
  const [stats, setStats] = useState(null);
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const googleButtonRef = useRef(null);
  const loginRef = useRef(login);

  useEffect(() => {
    loginRef.current = login;
  }, [login]);

  useEffect(() => {
    let cancelled = false;
    axios.get("/api/stats")
      .then((response) => {
        if (!cancelled) setStats(response.data);
      })
      .catch((err) => console.error("Unable to load public MealMate statistics:", err));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError("Google sign-in is not configured. Please use email and password or contact the administrator.");
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
            const response = await axios.post("/api/auth/google", { credential });
            loginRef.current(response.data.user, response.data.token);
            setLocation("/dashboard");
          } catch (err) {
            setError(err.response?.data?.message || "Google sign-in failed. Please try again.");
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
      if (!cancelled) {
        setError("Google sign-in could not load. Check your internet connection and try again.");
      }
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
  }, [setLocation]);

 async function handleForgotPassword(e){
  e.preventDefault();setForgotMessage("");
  if(!forgotEmail.trim())return setForgotMessage("Please enter your email address.");
  try{setForgotLoading(true);const r=await axios.post("/api/auth/forgot-password",{email:forgotEmail.trim()});setForgotMessage(r.data.message||"If an account exists for that email, a reset link has been sent.");}
  catch(err){setForgotMessage(err.response?.data?.message||"Unable to send the reset email. Please try again.");}
  finally{setForgotLoading(false);}
 }
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
      "/api/auth/login",
      { email, password }
    );

    localStorage.setItem("token", res.data.token);
    login(res.data.user, res.data.token); // stores user (with role) in AuthContext
    setLocation("/dashboard"); // redirect

  } catch (err) {
    setError(
      err.response?.data?.message || "Login Failed"
    );
  } finally {
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
              <ChefHat className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xl font-black text-gray-900 tracking-tight">
              MealMate
            </span>
          </Link>

          {/* Heading */ }
          <div className="mb-8">
            <h1 className="text-3xl font-black text-gray-900 mb-2">Welcome back</h1>
            <p className="text-gray-500">Login to continue your healthy journey.</p>
          </div>

          {showForgot&&<div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4"><div className="flex justify-between mb-2"><h2 className="font-bold text-gray-900">Reset your password</h2><button type="button" onClick={()=>setShowForgot(false)} className="text-sm text-gray-500">Close</button></div><p className="text-sm text-gray-600 mb-3">Enter your registered email and we’ll send a secure reset link.</p><form onSubmit={handleForgotPassword} className="space-y-3"><input type="email" required value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)} placeholder="you@example.com" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900"/><button type="submit" disabled={forgotLoading} className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{forgotLoading?"Sending...":"Send reset link"}</button></form>{forgotMessage&&<p role="status" className="mt-3 text-sm text-gray-700">{forgotMessage}</p>}</div>}
          {/* Google SSO Button */ }
          <div className="w-full flex justify-center mb-6">
            <div ref={googleButtonRef} aria-label="Continue with Google" />
          </div>

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
                <button type="button" onClick={() => { setShowForgot(true); setForgotEmail(email); setForgotMessage(""); }} className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                  Forgot password?
                </button>
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
          <span className="text-white text-sm font-medium">
            {stats ? `${Number(stats.registeredUsers || 0).toLocaleString()} registered members` : "A smarter way to plan meals"}
          </span>
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

        {/* Show a real community review when one is available; never display sample testimonials. */}
        <motion.div
          initial={ { opacity: 0, y: 20 } }
          animate={ { opacity: 1, y: 0 } }
          transition={ { duration: 0.6, delay: 0.8 } }
          className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 relative z-10"
        >
          {stats?.recentReviews?.[0] ? (
            <>
              <div className="flex items-center gap-1 mb-3" aria-label={`${stats.recentReviews[0].rating} out of 5 stars`}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className={`w-4 h-4 ${star <= stats.recentReviews[0].rating ? "fill-amber-400 text-amber-400" : "fill-white/20 text-white/20"}`} viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-white/90 text-sm leading-relaxed mb-4 italic">"{stats.recentReviews[0].feedback}"</p>
              <p className="text-white font-semibold text-sm">{stats.recentReviews[0].reviewer}</p>
              <p className="text-green-200 text-xs">Reviewed: {stats.recentReviews[0].recipe}</p>
              {stats.averageRecipeRating != null && (
                <p className="text-green-100 text-xs mt-3">
                  Community average: {stats.averageRecipeRating}/5 ({Number(stats.recipeRatingCount || 0).toLocaleString()} ratings)
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-white font-semibold mb-2">Made for everyday cooking</p>
              <p className="text-green-100 text-sm leading-relaxed">
                Plan meals, make the most of your pantry, and discover recipes that fit your routine.
              </p>
              {stats?.averageRecipeRating != null && (
                <p className="text-green-100 text-xs mt-3">
                  Community recipe rating: {stats.averageRecipeRating}/5 ({Number(stats.recipeRatingCount || 0).toLocaleString()} ratings)
                </p>
              )}
            </>
          )}
        </motion.div>
      </div>

    </div>
  );
}

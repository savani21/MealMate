import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, CheckCircle, Leaf, Mail } from "lucide-react";
import axios from "axios";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        "http://localhost:5000/api/auth/forgot-password",
        { email: email.trim() }
      );
      setSuccess(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send the reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <section className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <span className="bg-green-50 p-2 rounded-xl"><Leaf className="w-6 h-6 text-green-600" /></span>
          <span className="text-xl font-black text-gray-900">MealMate <span className="text-green-600">AI</span></span>
        </Link>

        <div className="mb-7">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot your password?</h1>
          <p className="text-sm text-gray-500">Enter the email address linked to your MealMate account. We’ll send you a password reset link.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="reset-email" className="block text-sm font-semibold text-gray-700 mb-2">Email address</label>
            <input
              id="reset-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
            />
          </div>

          {error && <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
          {success && (
            <div role="status" className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-3 flex gap-2">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60">
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <Link href="/login" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800">
          <ArrowLeft className="w-4 h-4" /> Back to login
        </Link>
      </section>
    </main>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { triggerForgotPassword, confirmForgotPasswordCall } = useAuth();
  
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSendCode(e) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    const result = await triggerForgotPassword(email);
    if (result.success) {
      setStep(2);
    } else {
      setError(result.error);
    }
    setIsLoading(false);
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setError("");
    
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);
    
    const result = await confirmForgotPasswordCall(email, code, newPassword);
    if (result.success) {
      navigate("/login", { state: { message: "Password reset successful. Please sign in with your new password." } });
    } else {
      setError(result.error);
      setIsLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#030509] px-4 py-12 sm:px-6 lg:px-8">
      {/* Ambient gradients */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-10%,rgba(124,58,237,0.20),transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05060b] via-[#020306] to-[#030509]" />
      </div>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-violet-600/5 blur-3xl" />
      </div>

      <div className="w-full max-w-[420px] relative z-10 animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xl font-black text-white shadow-lg shadow-violet-500/30 transition-transform duration-300 group-hover:scale-105">
              P
            </div>
            <span className="text-xl font-black tracking-widest text-white">POPVERSE</span>
          </Link>
          <h2 className="mt-8 text-3xl font-black tracking-tight text-white">
            Reset password
          </h2>
          <p className="mt-2.5 text-sm text-zinc-500">
            {step === 1
              ? "Enter your email to receive a reset code."
              : "Enter the code sent to your email and your new password."}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-violet-500' : 'bg-white/10'}`} />
          <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-violet-500' : 'bg-white/10'}`} />
        </div>

        {step === 1 ? (
          <form
            className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-7 shadow-2xl shadow-black/50 backdrop-blur-2xl space-y-5"
            onSubmit={handleSendCode}
          >
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.08] p-4 text-sm text-red-400">
                <svg className="h-4 w-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <div>
              <label className="block mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-premium"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                "Send Reset Code"
              )}
            </button>

            <div className="text-center">
              <Link to="/login" className="text-sm font-semibold text-zinc-500 transition-colors hover:text-zinc-300">
                ← Back to sign in
              </Link>
            </div>
          </form>
        ) : (
          <form
            className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-7 shadow-2xl shadow-black/50 backdrop-blur-2xl space-y-4"
            onSubmit={handleResetPassword}
          >
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.08] p-4 text-sm text-red-400">
                <svg className="h-4 w-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <div>
              <label className="block mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500" htmlFor="code">
                Reset Code
              </label>
              <input
                id="code"
                name="code"
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="input-premium text-center text-xl tracking-[0.5em] font-bold"
                placeholder="000000"
              />
            </div>

            <div>
              <label className="block mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500" htmlFor="newPassword">
                New Password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-premium"
                placeholder="Min. 8 characters"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

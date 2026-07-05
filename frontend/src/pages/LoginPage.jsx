// src/pages/LoginPage.jsx
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const POSTERS = [
  "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg", "/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg", 
  "/qJ2tW6WMUDux911r6m7haRef0WH.jpg", "/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
  "/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg", "/A4j8S6moJS2zNtRR8oWF08gRnL5.jpg",
  "/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg", "/mBaXZ95R2OxueZhvQbcEWy2DqyO.jpg",
  "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg", "/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg",
  "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg", "/d5iIlFn5s0ImszYzBPbOYKQmG_1.jpg"
];

const COL_1 = [...POSTERS.slice(0, 4), ...POSTERS.slice(0, 4)];
const COL_2 = [...POSTERS.slice(4, 8), ...POSTERS.slice(4, 8)];
const COL_3 = [...POSTERS.slice(8, 12), ...POSTERS.slice(8, 12)];

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const from = location.state?.from?.pathname || "/";
  const message = location.state?.message;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    const result = await login(email, password);
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error);
      setIsLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen bg-[#030509]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        @keyframes slide-up {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        @keyframes slide-down {
          0% { transform: translateY(-50%); }
          100% { transform: translateY(0); }
        }
        @keyframes glow-breathe {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes field-enter {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 30s linear infinite; }
        .animate-slide-down { animation: slide-down 30s linear infinite; }
        .font-display { font-family: 'Outfit', 'Inter', system-ui, sans-serif; }
        .field-stagger { animation: field-enter 0.5s ease both; }
        .field-stagger:nth-child(1) { animation-delay: 0.1s; }
        .field-stagger:nth-child(2) { animation-delay: 0.2s; }
        .field-stagger:nth-child(3) { animation-delay: 0.3s; }
        .field-stagger:nth-child(4) { animation-delay: 0.35s; }
        .field-stagger:nth-child(5) { animation-delay: 0.4s; }
      `}</style>

      {/* ───────── LEFT PANEL - Pop Culture Visuals ───────── */}
      <div className="relative hidden w-[55%] overflow-hidden bg-black lg:block">
        {/* Animated Poster Grid — w780 for sharp quality */}
        <div className="absolute -inset-12 flex justify-center gap-5 opacity-35 rotate-[-6deg] scale-110 pointer-events-none select-none">
          <div className="flex w-1/3 flex-col gap-5 animate-slide-up">
            {COL_1.map((p, i) => (
              <img key={`c1-${i}`} src={`https://image.tmdb.org/t/p/w780${p}`} className="w-full rounded-2xl object-cover shadow-2xl" alt="" loading="lazy" />
            ))}
          </div>
          <div className="flex w-1/3 flex-col gap-5 animate-slide-down">
            {COL_2.map((p, i) => (
              <img key={`c2-${i}`} src={`https://image.tmdb.org/t/p/w780${p}`} className="w-full rounded-2xl object-cover shadow-2xl" alt="" loading="lazy" />
            ))}
          </div>
          <div className="flex w-1/3 flex-col gap-5 animate-slide-up" style={{ animationDuration: '35s' }}>
            {COL_3.map((p, i) => (
              <img key={`c3-${i}`} src={`https://image.tmdb.org/t/p/w780${p}`} className="w-full rounded-2xl object-cover shadow-2xl" alt="" loading="lazy" />
            ))}
          </div>
        </div>

        {/* Cinematic overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#030509]/10 via-[#030509]/60 to-[#030509]" />
        <div className="absolute inset-0 bg-violet-950/20 mix-blend-color" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,rgba(124,58,237,0.18),transparent_55%)]" />

        {/* Hero Text */}
        <div className="absolute bottom-20 left-16 right-16">
          <div className="mb-6 inline-flex animate-fade-up items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-violet-300 backdrop-blur-xl">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
            PopCultureHub
          </div>
          <h1 className="font-display animate-fade-up text-[3.2rem] font-extrabold leading-[1.08] tracking-tight text-white" style={{ textShadow: '0 4px 40px rgba(0,0,0,0.7)' }}>
            Your universe of cinema, music &amp; more.
          </h1>
          <p className="mt-5 max-w-sm animate-fade-up text-[1.05rem] leading-relaxed text-zinc-400 stagger-2" style={{ fontWeight: 400 }}>
            Track what you watch, curate playlists, and connect with a community of pop culture enthusiasts.
          </p>
        </div>
      </div>

      {/* ───────── RIGHT PANEL - Login Form ───────── */}
      <div className="relative flex w-full flex-col items-center justify-center px-6 py-12 lg:w-[45%] lg:px-12 xl:px-20">
        {/* Mobile Background */}
        <div className="absolute inset-0 -z-10 block lg:hidden">
          <img src="https://image.tmdb.org/t/p/original/2ssWTSVklAEc98frZUQhgtGHx7s.jpg" className="h-full w-full object-cover opacity-10" alt="" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#030509]/40 via-[#030509]/80 to-[#030509]" />
        </div>

        {/* Ambient glow behind the form */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-[38%] h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/[0.07] blur-[100px]" style={{ animation: 'glow-breathe 4s ease-in-out infinite' }} />
        </div>

        <div className="relative w-full max-w-[420px] animate-fade-up">
          {/* Logo */}
          <Link to="/" className="mb-12 inline-flex items-center gap-3 group">
            <img
              src="/images/popverse.png"
              alt="Popverse"
              style={{ height: '28px', width: 'auto', display: 'block', objectFit: 'contain' }}
            />
          </Link>

          <h2 className="font-display text-[2.1rem] font-extrabold tracking-tight text-white leading-tight">
            Welcome back
          </h2>
          <p className="mt-2.5 text-[15px] text-zinc-500">
            Don't have an account?{" "}
            <Link to="/signup" className="font-semibold text-violet-400 transition-colors hover:text-violet-300">
              Sign up for free
            </Link>
          </p>

          {/* ── Glassmorphism Form Card ── */}
          <div className="mt-9 rounded-[20px] border border-white/[0.07] bg-white/[0.025] p-7 sm:p-8 shadow-[0_8px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            <form className="space-y-5" onSubmit={handleSubmit}>
              {message && (
                <div className="field-stagger flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] p-3.5 text-sm text-emerald-400">
                  <svg className="h-4 w-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {message}
                </div>
              )}
              {error && (
                <div className="field-stagger flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.07] p-3.5 text-sm text-red-400">
                  <svg className="h-4 w-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <div className="field-stagger">
                <label className="block mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500" htmlFor="email">
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
                  className="input-field"
                  placeholder="you@example.com"
                />
              </div>

              <div className="field-stagger">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500" htmlFor="password">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-[11px] font-semibold text-violet-400/80 transition-colors hover:text-violet-300">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pr-11"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center px-3.5 text-zinc-600 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="field-stagger pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-v w-full py-3.5 text-[15px] font-bold shadow-[0_4px_24px_rgba(139,92,246,0.3)] hover:shadow-[0_6px_32px_rgba(139,92,246,0.45)] disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isLoading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    "Sign in"
                  )}
                </button>
              </div>

              <p className="field-stagger text-center text-[11px] font-medium text-zinc-600 pt-1">
                By signing in, you agree to our{" "}
                <span className="text-zinc-400 cursor-pointer hover:text-zinc-300 transition-colors">Terms</span> and{" "}
                <span className="text-zinc-400 cursor-pointer hover:text-zinc-300 transition-colors">Privacy Policy</span>
              </p>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

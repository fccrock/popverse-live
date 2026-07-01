import { Link } from "react-router-dom";

export default function ComingSoonPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#050507] px-4 text-center">
      <div className="relative mb-8 grid h-24 w-24 place-items-center rounded-3xl border border-white/[0.08] bg-white/[0.03] shadow-2xl overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-tr before:from-violet-500/20 before:to-transparent">
        <svg className="h-10 w-10 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      
      <h1 className="mb-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Coming Soon!</h1>
      <p className="mx-auto max-w-md text-base text-zinc-400">
        We're working hard to bring this category to Popverse. Stay tuned for an amazing new experience!
      </p>
      
      <Link 
        to="/" 
        className="btn-ghost mt-8 inline-flex items-center gap-2 py-3 px-6 text-sm font-semibold text-white"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back to Home
      </Link>
    </div>
  );
}

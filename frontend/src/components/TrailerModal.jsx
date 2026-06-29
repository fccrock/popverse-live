// src/components/TrailerModal.jsx
// Renders a play button centered in the hero banner.
// Clicking it opens a fullscreen YouTube overlay.
// Drop this inside the hero <section> alongside the backdrop image.

import { useEffect, useState } from "react";

export default function TrailerModal({ title, trailerKey, accent = "violet" }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e) { if (e.key === "Escape") setIsOpen(false); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen]);

  if (!trailerKey) return null;

  const ringColor =
    accent === "cyan"  ? "ring-cyan-400/30 hover:ring-cyan-400/60 shadow-[0_0_40px_rgba(6,182,212,0.25)]" :
    accent === "rose"  ? "ring-rose-400/30 hover:ring-rose-400/60 shadow-[0_0_40px_rgba(244,63,94,0.25)]" :
                         "ring-violet-400/30 hover:ring-violet-400/60 shadow-[0_0_40px_rgba(124,58,237,0.25)]";

  const playColor =
    accent === "cyan"  ? "text-cyan-300" :
    accent === "rose"  ? "text-rose-300" :
                         "text-violet-300";

  return (
    <>
      {/* ── Play button lives inside the hero ── */}
      <button
        aria-label={`Play ${title} trailer`}
        className={`absolute left-1/2 top-[27%] z-20 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/40 ${ringColor} ring-1 backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:bg-black/60 sm:h-20 sm:w-20 lg:top-[29%]`}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        {/* Outer pulse ring */}
        <span className="absolute inset-0 rounded-full ring-1 ring-white/10 animate-ping opacity-30" />
        <svg className={`ml-0.5 h-6 w-6 sm:h-8 sm:w-8 ${playColor} drop-shadow-lg`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      </button>

      {/* ── Fullscreen overlay ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/90 px-4 py-8 backdrop-blur-xl animate-fade-in"
          onClick={() => setIsOpen(false)}
        >
          <button
            aria-label="Close trailer"
            className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-xl bg-white/[0.08] border border-white/[0.10] text-white backdrop-blur-md transition-all hover:bg-white/[0.15] hover:scale-105"
            onClick={() => setIsOpen(false)}
            type="button"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div
            className="w-full max-w-5xl overflow-hidden rounded-2xl border border-white/[0.08] bg-black shadow-2xl shadow-black animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="aspect-video w-full"
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
              title={`${title} trailer`}
            />
          </div>
        </div>
      )}
    </>
  );
}

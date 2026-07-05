// src/pages/HomePage.jsx
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";
import { posterUrl, backdropUrl, getTitle, getYear } from "../utils/tmdb";

/* ── FEATURED SPOTLIGHT (one per module) ── */
const FEATURED = [
  {
    id: 157336,
    moduleLabel: "Cinema",
    title: "Interstellar",
    tagline: "Mankind was born on Earth. It was never meant to die here.",
    genres: ["Sci-Fi", "Drama", "Adventure"],
    year: "2014", rating: "8.7",
    backdrop: "/2ssWTSVklAEc98frZUQhgtGHx7s.jpg",
    poster: "/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg",
    accent: "#7c3aed",
    explorePath: "/cinema",
    detailPath: "/cinema/157336",
  },
  {
    id: "music-kshama",
    moduleLabel: "Music",
    title: "Kshama",
    tagline: "Round 3. Ice. Gourmet Shit. Seedhe Maut's masterpiece EP.",
    genres: ["Hip-Hop", "Indian Rap", "Seedhe Maut"],
    year: "2024", rating: "9.6",
    backdrop: "/images/KSHAMA.jpg",
    poster: "/images/KSHAMA.jpg",
    accent: "#f97316",
    objectPosition: "100% 95%", // <-- Tweak this number to move the image up/down
    explorePath: "/music",
    detailPath: "/music",
  },
  {
    id: "game-rdr2",
    moduleLabel: "Games",
    title: "Red Dead Redemption 2",
    tagline: "America, 1899. The end of the wild west era has begun.",
    genres: ["Open World", "Action", "Story Rich"],
    year: "2018", rating: "9.7",
    backdrop: "/images/RDR_2_Artwork_OfficialArt.jpg",
    poster: "/images/RDR_2_Artwork_OfficialArt.jpg",
    accent: "#c2820a",
    explorePath: "/games",
    detailPath: "/games",
  },
  {
    id: "book-1984",
    moduleLabel: "Books",
    title: "1984",
    tagline: "Turn the page on worlds beyond imagination. Curate your literary journey.",
    genres: ["Dystopian", "Classic", "George Orwell"],
    year: "1949", rating: "9.1",
    backdrop: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1920&q=80",
    poster: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80",
    accent: "#06b6d4",
    explorePath: "/books",
    detailPath: "/books",
  },
];

/* Resolve image path — TMDB paths start with /, external URLs are used as-is */
const resolveImg = (path, tmdbSize = "original") => {
  if (path.startsWith("/") && !path.startsWith("/images/")) {
    return `https://image.tmdb.org/t/p/${tmdbSize}${path}`;
  }
  return path;
};

const CATEGORIES = [
  { label: "Cinema", sub: "Movies & TV Shows", href: "/cinema", accent: "#8b5cf6", backdrop: "/images/scarface-al-pacino-5k-8k-7680x4320-13463.jpg" },
  { label: "Music",  sub: "Artists & Albums",  href: "/music",  accent: "#f97316", backdrop: "/images/13UMGIM63890.rgb.jpg" },
  { label: "Games",  sub: "Play & Discover",   href: "/games",  accent: "#22c55e", backdrop: "/images/Games_Ghost-of-Tsushima.jpg" },
  { label: "Books",  sub: "Read & Explore",    href: "/books",  accent: "#06b6d4", backdrop: "/images/1447315._sy475_ (1).jpg" },
];

/* ── MARQUEE TICKER ── */
const MARQUEE_ITEMS = [
  "Dune: Part Two", "Oppenheimer", "Interstellar", "The Dark Knight", "Shogun", "Succession", "Attack on Titan",
  "Mad Max: Fury Road", "Spider-Verse", "Better Call Saul", "Blade Runner 2049", "The Bear", "Chainsaw Man",
];

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-1.5">
      <svg className="h-3.5 w-3.5 fill-yellow-400" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      <span className="text-sm font-black text-yellow-400">{rating}</span>
    </div>
  );
}

/* ── HERO SECTION ─────────────────────────────────────────────────────────── */
function HeroSection() {
  const [index, setIndex] = useState(0);
  const [prev, setPrev] = useState(null);
  const animating = useRef(false);
  const film = FEATURED[index];

  const goTo = (i) => {
    if (i === index || animating.current) return;
    animating.current = true;
    setPrev(index);
    setIndex(i);
    setTimeout(() => { setPrev(null); animating.current = false; }, 700);
  };

  // Auto-rotate every 5 seconds
  useEffect(() => {
    const t = setTimeout(() => goTo((index + 1) % FEATURED.length), 5000);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <section className="relative h-screen min-h-[600px] max-h-[920px] overflow-hidden select-none">
      {/* Background backdrop layers */}
      {FEATURED.map((f, i) => (
        <div
          key={f.id}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === index ? 1 : i === prev ? 0 : 0 }}
        >
          <img
            src={resolveImg(f.backdrop)}
            alt=""
            className="h-full w-full object-cover"
            style={{ objectPosition: f.objectPosition || "center" }}
            draggable={false}
          />
        </div>
      ))}

      {/* Cinematic gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#050507] via-[#050507]/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-transparent to-[#050507]/40" />
      {/* Colored accent glow from film */}
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{ background: `radial-gradient(ellipse at 60% 50%, ${film.accent}18 0%, transparent 55%)` }}
      />
      {/* Film grain */}
      <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.06'/%3E%3C/svg%3E")`,
      }} />

      {/* Content */}
      <div className="relative mx-auto flex h-full w-full max-w-[1840px] flex-col justify-center px-6 pb-24 pt-16 sm:px-10 lg:px-14 xl:px-16">
        <div key={index} className="animate-fade-up max-w-5xl">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-zinc-300 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full animate-breathe" style={{ background: film.accent }} />
              {film.moduleLabel}
            </span>
            <StarRating rating={film.rating} />
          </div>

          {/* Title */}
          <h1
            className="text-white"
            style={{ 
              fontFamily: "'Outfit', 'Inter', sans-serif",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1,
              fontSize: "clamp(2.6rem, 4.5vw, 4.2rem)",
              textTransform: "uppercase",
              textShadow: "0 4px 48px rgba(0,0,0,.7)"
            }}
          >
            {film.title}
          </h1>

          {/* Tagline */}
          <p className="mt-4 max-w-lg text-base font-medium leading-7 text-zinc-400 sm:text-lg stagger-1 animate-fade-up">
            {film.tagline}
          </p>

          {/* Metadata row */}
          <div className="mt-5 flex flex-wrap items-center gap-3 stagger-2 animate-fade-up">
            <span className="tag">{film.year}</span>
            {film.genres.map((g) => <span key={g} className="tag">{g}</span>)}
          </div>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap gap-3 stagger-3 animate-fade-up">
            <Link to={film.explorePath} className="btn-v gap-2.5 px-6 py-3 text-base">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
              Explore
            </Link>
            <Link to={film.detailPath} className="btn-ghost px-6 py-3 text-base">
              View Details
            </Link>
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-10 inset-x-0 mx-auto flex w-full max-w-[1840px] items-center gap-2.5 px-6 sm:px-10 lg:px-14 xl:px-16 pointer-events-none">
        {FEATURED.map((f, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="group relative transition-all duration-300 pointer-events-auto"
          >
            <div
              className="rounded-full transition-all duration-300"
              style={{
                height: 3,
                width: i === index ? 32 : 12,
                background: i === index ? film.accent : "rgba(255,255,255,.25)",
              }}
            />
            {/* Progress bar on active */}
            {i === index && (
              <div
                className="absolute inset-0 rounded-full"
                style={{ background: film.accent, animation: "shimmer 5s linear" }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Poster thumbnails (right side) */}
      <div className="absolute inset-x-0 top-1/2 mx-auto hidden w-full max-w-[1840px] -translate-y-1/2 justify-end px-6 sm:px-10 lg:px-14 xl:px-16 xl:flex pointer-events-none">
        <div className="flex flex-col gap-3 pointer-events-auto">
          {FEATURED.map((f, i) => (
            <button
              key={f.id}
              onClick={() => goTo(i)}
              className="overflow-hidden rounded-xl border transition-all duration-300"
            style={{
              width: 60, height: 80,
              borderColor: i === index ? film.accent : "rgba(255,255,255,.08)",
              opacity: i === index ? 1 : 0.45,
              transform: i === index ? "scale(1.1)" : "scale(1)",
            }}
          >
            <img src={resolveImg(f.poster, "w185")} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
        </div>
      </div>
    </section>
  );
}

/* ── TRENDING RAIL ──────────────────────────────────────────────────────── */
function TrendingRail({ title, items, type }) {
  const railRef = useRef(null);

  const scroll = (direction) => {
    if (railRef.current) {
      const { clientWidth } = railRef.current;
      const scrollAmount = clientWidth * 0.75;
      railRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1840px]">
      <div className="mb-4 flex items-end justify-between px-4 sm:px-6 lg:px-8">
        <div>
          <p className="eyebrow mb-1">{type === "music" ? "Music" : type === "movie" ? "Cinema" : "TV"}</p>
          <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">{title}</h2>
        </div>
        <Link
          to={type === "music" ? "/music" : type === "movie" ? "/cinema" : "/search?type=tv"}
          className="flex items-center gap-1 text-sm font-semibold text-zinc-600 transition hover:text-violet-400"
        >
          View all
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
        </Link>
      </div>

      {/* Container with hover group for paddle buttons */}
      <div className="group relative">
        {/* Left Paddle */}
        <button
          onClick={() => scroll('left')}
          className="group/paddle absolute left-0 top-0 z-20 h-full w-16 flex items-center justify-center hidden sm:flex cursor-pointer"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 shadow-md opacity-0 transition-all duration-200 transform-gpu group-hover:opacity-100 group-hover/paddle:bg-white/20 group-hover/paddle:scale-110 group-active/paddle:scale-95">
            <svg 
              className="h-5 w-5 text-white" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </div>
        </button>

        {/* Scrollable rail */}
        <div ref={railRef} className="rail gap-4 px-4 sm:px-6 lg:px-8 relative z-10 scroll-smooth">
        {items.map((item, idx) => {
          const isMusic = type === "music";
          const itemId = isMusic ? item.id?.attributes?.["im:id"] : item.id;
          const href = isMusic ? `/music/album/${itemId}` : type === "movie" ? `/cinema/${item.id}` : `/tv/${item.id}`;
          
          let poster = isMusic 
            ? (item["im:image"]?.[2]?.label?.replace("170x170", "500x500") || item["im:image"]?.[2]?.label) 
            : item.poster_path;
            
          const displayTitle = isMusic ? item["im:name"]?.label : getTitle(item);
          const displaySub = isMusic ? item["im:artist"]?.label : getYear(item);

          return (
            <Link
              key={itemId}
              to={href}
              className="group relative shrink-0 w-[140px] sm:w-[160px]"
            >
              {/* Poster */}
              <div className={`poster-card ${isMusic ? "music-card" : ""}`} style={{ aspectRatio: isMusic ? "1/1" : "2/3" }}>
                {/* Rank (Glassmorphism Overlay) */}
                <div className="absolute left-0 top-0 z-10 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-br-2xl bg-white/10 backdrop-blur-md border-r border-b border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
                  <span className="text-xl sm:text-2xl font-black text-white drop-shadow-md">{idx + 1}</span>
                </div>
                
                {poster ? (
                  <img
                    src={isMusic ? poster : posterUrl(poster, "w342")}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-zinc-700 text-xs">No image</div>
                )}
                {/* Rating badge */}
                {!isMusic && (
                  <div className="absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-black/70 px-2 py-1 text-[10px] font-black text-yellow-400 backdrop-blur-md">
                    <svg className="h-2.5 w-2.5 fill-yellow-400" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    {item.vote_average?.toFixed(1) ?? "NR"}
                  </div>
                )}
                {/* Hover overlay */}
                <div className="poster-overlay">
                  <p className="text-xs font-black text-white leading-tight line-clamp-2">{displayTitle}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">{displaySub}</p>
                </div>
              </div>
              {/* Title below */}
              <div className="mt-2.5 px-0.5">
                <p className="truncate text-xs font-bold text-zinc-300 transition group-hover:text-white">{displayTitle}</p>
                <p className="text-[10px] text-zinc-600 mt-0.5 truncate">{displaySub}</p>
              </div>
            </Link>
          );
        })}
        </div>

        {/* Right Paddle */}
        <button
          onClick={() => scroll('right')}
          className="group/paddle absolute right-0 top-0 z-20 h-full w-16 flex items-center justify-center hidden sm:flex cursor-pointer"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 shadow-md opacity-0 transition-all duration-200 transform-gpu group-hover:opacity-100 group-hover/paddle:bg-white/20 group-hover/paddle:scale-110 group-active/paddle:scale-95">
            <svg 
              className="h-5 w-5 text-white" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </div>
        </button>
      </div>
    </div>
  );
}

/* ── CATEGORIES BENTO ────────────────────────────────────────────────────── */
function CategoriesBento() {
  return (
    <div className="mx-auto w-full max-w-[1840px] px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="eyebrow mb-1">Explore</p>
        <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">Browse Categories</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CATEGORIES.map((cat, idx) => (
          <Link
            key={cat.label}
            to={cat.href}
            className="group relative overflow-hidden rounded-2xl"
            style={{ 
              aspectRatio: "16/9", 
              border: "1px solid rgba(255,255,255,0.08)",
              transition: "box-shadow 0.5s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = `0 20px 50px -10px ${cat.accent}66`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <img
              src={resolveImg(cat.backdrop, 'w780')}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-80 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
            />
            {/* Bottom gradient */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#050507] to-transparent" />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-5">
              <div className="flex items-end justify-between">
                <div>
                  <h3 className="text-xl font-black text-white leading-tight">{cat.label}</h3>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: cat.accent }}>{cat.sub}</p>
                </div>
                <div className="flex items-center gap-1.5 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 translate-x-[-4px]">
                  <span className="text-[12px] font-semibold text-zinc-300">Explore</span>
                  <svg className="h-4 w-4 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ── MARQUEE TICKER ─────────────────────────────────────────────────────── */
function Marquee() {
  return (
    <div
      className="relative flex overflow-hidden py-3"
      style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
    >
      <div className="animate-marquee flex shrink-0 gap-8 pr-8 whitespace-nowrap">
        {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((t, i) => (
          <span key={i} className="flex items-center gap-3 text-xs font-semibold text-zinc-600">
            {t}
            <span className="h-1 w-1 rounded-full bg-violet-600/50" />
          </span>
        ))}
      </div>
      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 w-16 z-10" style={{ background: "linear-gradient(to right, var(--surface), transparent)" }} />
      <div className="absolute inset-y-0 right-0 w-16 z-10" style={{ background: "linear-gradient(to left, var(--surface), transparent)" }} />
    </div>
  );
}

/* ── MAIN PAGE ──────────────────────────────────────────────────────────── */
export default function HomePage() {
  const [trending, setTrending] = useState({ movies: [], tv: [] });
  const [trendingMusic, setTrendingMusic] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTrendingMovies()
      .then((data) => {
        const results = data.results ?? [];
        setTrending({
          movies: results.slice(0, 10),
          tv: [],
        });
      })
      .catch(() => {});

    api.getMusicCharts()
      .then((d) => setTrendingMusic((d?.feed?.entry ?? []).slice(0, 10)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ background: "var(--bg)" }}>
      {/* ── Cinematic Hero ── */}
      <HeroSection />

      {/* ── Marquee ── */}
      <Marquee />

      {/* ── Content Sections ── */}
      <div className="space-y-12 py-12 pb-24">
        {loading ? (
          /* Skeleton */
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="mb-4 h-5 w-48 rounded-xl shimmer" />
            <div className="flex gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-[140px] shrink-0">
                  <div className="shimmer rounded-xl" style={{ aspectRatio: "2/3" }} />
                  <div className="mt-2 h-3 w-4/5 rounded shimmer" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <TrendingRail title="Trending Movies" items={trending.movies} type="movie" />
            <CategoriesBento />
            <TrendingRail title="Trending Music" items={trendingMusic} type="music" />
          </>
        )}
      </div>

      {/* Mobile bottom nav buffer */}
      <div className="h-16 lg:hidden" />
    </div>
  );
}

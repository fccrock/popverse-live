// src/pages/CinemaPage.jsx
// Cinema page — mirrors the HomePage's premium layout
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";
import { posterUrl, backdropUrl, getTitle, getYear } from "../utils/tmdb";

/* ── FEATURED FILMS (hardcoded spotlight picks) ── */
const FEATURED = [
  {
    id: 530915, type: "movie",
    title: "1917",
    tagline: "Time is the enemy.",
    genres: ["War", "Drama", "History"],
    year: "2019", rating: "8.0",
    backdrop: "/2lBOQK06tltt8SQaswgb8d657Mv.jpg",
    poster: "/iZf0KyrE25z1sage4SYFLCCrMi9.jpg",
    logo: "https://image.tmdb.org/t/p/w500/wwSU87KF5cqBLI4ani5vOnYIErh.png",
    accent: "#eab308",
  },
  {
    id: 100088, type: "tv",
    title: "The Last of Us",
    tagline: "Every path has a price.",
    genres: ["Drama", "Action", "Sci-Fi"],
    year: "2023", rating: "8.4",
    backdrop: "/acevLdSl5I2MK5RYAm7gwAndt1w.jpg",
    poster: "/dmo6TYuuJgaYinXBPjrgG9mB5od.jpg",
    logo: "https://image.tmdb.org/t/p/w500/msYtgZbEo8tAOJ37T50kgqulpKf.png",
    accent: "#22c55e",
  },
  {
    id: 569094, type: "movie",
    title: "Spider-Man: Across the Spider-Verse",
    tagline: "It's how you wear the mask that matters.",
    genres: ["Animation", "Action", "Adventure"],
    year: "2023", rating: "8.7",
    backdrop: "/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg",
    poster: "/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
    logo: "https://image.tmdb.org/t/p/w500/cmE0j3mQQe6xrzLryxGF9rF2KC8.png",
    accent: "#e11d48",
  },
  {
    id: 85937, type: "tv",
    title: "Demon Slayer",
    tagline: "The love of a brother transcends everything.",
    genres: ["Animation", "Action", "Fantasy"],
    year: "2019", rating: "8.6",
    backdrop: "/3GQKYh6Trm8pxd2AypovoYQf4Ay.jpg",
    poster: "/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg",
    logo: "https://image.tmdb.org/t/p/w500/ecghlDeabR3X3Vv8tXIOeXHQvQe.png",
    accent: "#16a34a",
  },
];

/* ── GENRE CATEGORIES ── */
const CATEGORIES = [
  {
    label: "Movies",
    sub: "Explore blockbusters & classics",
    href: "/movies",
    backdrop: "https://image.tmdb.org/t/p/original/zb6fM1CX41D9rF9hdgclu0peUmy.jpg",
    logo: "https://image.tmdb.org/t/p/w500/krEC3MIxUbiZy2uM0TemRio2Z2E.png",
    glow: "rgba(139,92,246,0.5)", // violet glow
  },
  {
    label: "TV Series",
    sub: "Binge-worthy series",
    href: "/tv-shows",
    backdrop: "https://image.tmdb.org/t/p/original/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg",
    logo: "https://image.tmdb.org/t/p/w500/chw44B2VnLha8iiTdyZcIW0ZELC.png",
    glow: "rgba(59,130,246,0.5)", // blue glow
  },
  {
    label: "Anime",
    sub: "From shonen epics to psychological masterpieces",
    href: "/anime",
    backdrop: "https://image.tmdb.org/t/p/original/bXi8lEPppxvtNFDkgIw7nj19psC.jpg",
    logo: "https://image.tmdb.org/t/p/w500/b2BK6kVTBmf3aDFs8VI6sKAu2wY.png",
    glow: "rgba(244,63,94,0.5)", // rose glow
  },
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
            src={`https://image.tmdb.org/t/p/original${f.backdrop}`}
            alt=""
            className="h-full w-full object-cover object-center"
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
              Featured Film
            </span>
            <StarRating rating={film.rating} />
          </div>

          {/* Title or Logo */}
          {film.logo ? (
            <img 
              src={film.logo} 
              alt={film.title} 
              className="h-auto max-h-[120px] w-auto max-w-[90%] object-contain object-left mb-6 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] filter brightness-110" 
            />
          ) : (
            <h1
              className="font-black leading-[0.9] tracking-tight text-white mb-6 drop-shadow-2xl"
              style={{ fontSize: "clamp(52px, 8vw, 96px)" }}
            >
              {film.title}
            </h1>
          )}

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
            <Link to={`/cinema/${film.id}`} className="btn-v gap-2.5 px-6 py-3 text-base">
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              Watch Now
            </Link>
            <Link to={`/cinema/${film.id}`} className="btn-ghost px-6 py-3 text-base">
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
            <img src={`https://image.tmdb.org/t/p/w185${f.poster}`} alt="" className="h-full w-full object-cover" />
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
          <p className="eyebrow mb-1">{type === "movie" ? "Cinema" : "TV"}</p>
          <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">{title}</h2>
        </div>
        <Link
          to={type === "movie" ? "/cinema" : "/search?type=tv"}
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
          const href = type === "movie" ? `/cinema/${item.id}` : `/tv/${item.id}`;
          const poster = item.poster_path;
          return (
            <Link
              key={item.id}
              to={href}
              className="group relative shrink-0 w-[140px] sm:w-[160px]"
            >
              {/* Poster */}
              <div className="poster-card" style={{ aspectRatio: "2/3" }}>
                {/* Rank (Glassmorphism Overlay) */}
                <div className="absolute left-0 top-0 z-10 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-br-2xl bg-white/10 backdrop-blur-md border-r border-b border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
                  <span className="text-xl sm:text-2xl font-black text-white drop-shadow-md">{idx + 1}</span>
                </div>
                
                {poster ? (
                  <img
                    src={posterUrl(poster, "w342")}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-zinc-700 text-xs">No image</div>
                )}
                {/* Rating badge */}
                <div className="absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-black/70 px-2 py-1 text-[10px] font-black text-yellow-400 backdrop-blur-md">
                  <svg className="h-2.5 w-2.5 fill-yellow-400" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  {item.vote_average?.toFixed(1) ?? "NR"}
                </div>
                {/* Hover overlay */}
                <div className="poster-overlay">
                  <p className="text-xs font-black text-white leading-tight">{getTitle(item)}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{getYear(item)}</p>
                </div>
              </div>
              {/* Title below */}
              <div className="mt-2.5 px-0.5">
                <p className="truncate text-xs font-bold text-zinc-300 transition group-hover:text-white">{getTitle(item)}</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">{getYear(item)}</p>
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.label}
            to={cat.href}
            className="group relative overflow-hidden rounded-2xl"
            style={{
              aspectRatio: "16/9",
              border: "1px solid rgba(255,255,255,0.08)",
              transition: "box-shadow 0.5s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = `0 20px 50px -10px ${cat.glow}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {/* Background image — only this scales on hover */}
            <img
              src={cat.backdrop}
              alt={cat.label}
              className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            />

            {/* Soft dark gradient base */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none z-0" />

            {/* Progressive Blur (Apple-style seamless liquid transition) */}
            <div 
              className="absolute inset-0 z-10 backdrop-blur-[24px] backdrop-saturate-[180%] pointer-events-none transition-opacity duration-700 opacity-90 group-hover:opacity-100"
              style={{
                WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 25%, rgba(0,0,0,0) 60%)",
                maskImage: "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 25%, rgba(0,0,0,0) 60%)"
              }}
            />

            {/* Text content anchored bottom-left */}
            <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col items-start z-20 transition-transform duration-700 group-hover:-translate-y-1">
              {/* Cinematic Movie Logo */}
              <img 
                src={cat.logo} 
                alt={`${cat.label} Logo`} 
                className="h-14 w-auto object-contain object-left drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] filter brightness-110 mb-4" 
              />
              
              {/* Category Pill */}
              <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-white/10 text-white backdrop-blur-md border border-white/20 shadow-sm`}>
                {cat.label}
              </span>
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
export default function CinemaPage() {
  const [trending, setTrending] = useState({ movies: [], tv: [], anime: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Helper: merge two result arrays, deduplicate strictly by id,
    // filter items missing poster_path, sort by popularity desc, take top 10.
    function mergeAndRank(trending, discover) {
      const seen = new Set();
      const merged = [];
      for (const item of [...trending, ...discover]) {
        if (!item || !item.id || !item.poster_path || seen.has(item.id)) continue;
        seen.add(item.id);
        merged.push(item);
      }
      return merged
        .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
        .slice(0, 10);
    }

    Promise.all([
      api.getTrendingMovies().catch(() => ({ results: [] })),
      api.getDiscoverMoviesIndian().catch(() => ({ results: [] })),
      api.getTrendingTv().catch(() => ({ results: [] })),
      api.getDiscoverTvIndian().catch(() => ({ results: [] })),
      api.getTrendingAnime().catch(() => ({ results: [] })),
    ]).then(([trendMovies, indMovies, trendTv, indTv, animeData]) => {
      setTrending({
        movies: mergeAndRank(trendMovies.results ?? [], indMovies.results ?? []),
        tv: mergeAndRank(trendTv.results ?? [], indTv.results ?? []),
        anime: (animeData.results ?? []).filter((i) => i.poster_path).slice(0, 10),
      });
    }).finally(() => setLoading(false));
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
            <TrendingRail title="Trending TV Shows" items={trending.tv} type="tv" />
            <TrendingRail title="Trending Anime" items={trending.anime} type="tv" />
          </>
        )}
      </div>

      {/* Mobile bottom nav buffer */}
      <div className="h-16 lg:hidden" />
    </div>
  );
}

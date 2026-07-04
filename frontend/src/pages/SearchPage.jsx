import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../utils/api";

import { API_BASE as API } from "../config.js";
import {
  getTitle,
  getYear,
  getMediaLabel,
  getRating,
  getResultHref,
  posterUrl,
  isAnime,
  tmdbGenres,
  tmdbLanguages,
} from "../utils/tmdb";

/* ─── Type filters (Music added) ─────────────────────────────── */
const typeFilters = [
  { label: "All",      value: "all" },
  { label: "Movies",   value: "movie" },
  { label: "TV Shows", value: "tv" },
  { label: "Anime",    value: "anime" },
  { label: "Music",    value: "music" },
  { label: "People",   value: "person" },
  { label: "Users",    value: "user" },
];

const sortOptions = [
  { label: "Relevance",    value: "relevance" },
  { label: "Popularity",   value: "popularity" },
  { label: "Rating",       value: "rating" },
  { label: "Release Date", value: "release_date" },
];

/* ─── Custom glassmorphism dropdown (portal-based, always on top) ──────── */
function GlassSelect({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  // Recalculate position whenever we open, or on scroll/resize
  function recalc() {
    if (btnRef.current) setRect(btnRef.current.getBoundingClientRect());
  }

  useEffect(() => {
    if (!open) return;
    recalc();
    window.addEventListener("scroll", recalc, true);
    window.addEventListener("resize", recalc);
    return () => {
      window.removeEventListener("scroll", recalc, true);
      window.removeEventListener("resize", recalc);
    };
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (
        btnRef.current && !btnRef.current.contains(e.target) &&
        panelRef.current && !panelRef.current.contains(e.target)
      ) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selected = options.find((o) => o.value === value);

  const dropdownStyle = rect
    ? {
        position: "fixed",
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
        minWidth: Math.max(rect.width, 180),
        zIndex: 99999,
      }
    : { display: "none" };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => { recalc(); setOpen(p => !p); }}
        className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm px-3 py-2 text-sm font-semibold text-zinc-300 hover:bg-white/[0.07] hover:border-white/[0.14] transition-all duration-150 whitespace-nowrap"
      >
        {selected?.label ?? "Select"}
        <svg
          className={`h-3.5 w-3.5 text-zinc-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && rect && createPortal(
        <div
          ref={panelRef}
          style={{
            ...dropdownStyle,
            width: Math.max(rect.width, 180),
            maxHeight: 320,
          }}
          className="rounded-2xl border border-white/[0.10] bg-[#0c0e1a]/70 backdrop-blur-2xl shadow-2xl shadow-black/80 overflow-y-auto"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-100 truncate ${
                value === opt.value
                  ? "bg-violet-500/20 text-violet-300 font-bold"
                  : "text-zinc-300 font-medium hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

/* ─── Filter / Sort helpers ──────────────────────────────────── */
function filterResults(items, { typeFilter, genreFilters, yearFrom, yearTo, languageFilter, minRating }) {
  return items.filter((item) => {
    if (typeFilter !== "all") {
      if (typeFilter === "anime") {
        if (!isAnime(item)) return false;
      } else if (item.media_type !== typeFilter) {
        return false;
      } else if (typeFilter === "tv" && isAnime(item)) {
        return false;
      }
    }

    if (item.media_type === "person") {
      if (genreFilters.length > 0 || yearFrom || yearTo || languageFilter || minRating > 0) return false;
      return true;
    }

    if (genreFilters.length > 0) {
      if (!item.genre_ids || !genreFilters.some((g) => item.genre_ids.includes(g))) return false;
    }

    const yearStr = getYear(item);
    const year = parseInt(yearStr, 10);
    if (!isNaN(year)) {
      if (yearFrom && year < parseInt(yearFrom, 10)) return false;
      if (yearTo   && year > parseInt(yearTo,   10)) return false;
    } else if (yearFrom || yearTo) {
      return false;
    }

    if (languageFilter && item.original_language !== languageFilter) return false;

    if (minRating > 0) {
      const rating = parseFloat(getRating(item));
      if (isNaN(rating) || rating < minRating) return false;
    }

    return true;
  });
}

function sortResults(items, sort) {
  const indexed = items.map((item, index) => ({ item, index }));
  indexed.sort((a, b) => {
    if (sort === "relevance")    return a.index - b.index;
    if (sort === "popularity")   return (b.item.popularity ?? 0) - (a.item.popularity ?? 0);
    if (sort === "rating") {
      return (parseFloat(getRating(b.item)) || 0) - (parseFloat(getRating(a.item)) || 0);
    }
    if (sort === "release_date") {
      const da = a.item.release_date ?? a.item.first_air_date ?? "";
      const db = b.item.release_date ?? b.item.first_air_date ?? "";
      return db.localeCompare(da);
    }
    return 0;
  });
  return indexed.map((i) => i.item);
}

/* ─── Skeleton ───────────────────────────────────────────────── */
function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div className="card" key={i}>
          <div className="aspect-[2/3] shimmer" />
          <div className="space-y-2.5 p-4">
            <div className="h-3 w-4/5 rounded-lg bg-white/[0.07] shimmer" />
            <div className="h-3 w-1/2 rounded-lg bg-white/[0.05] shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Music result card ──────────────────────────────────────── */
function MusicCard({ track }) {
  const art = track.artworkUrl100?.replace("100x100bb", "300x300bb");
  return (
    <a
      href={track.trackViewUrl || track.collectionViewUrl || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm transition-all duration-300 hover:border-violet-500/20 hover:bg-white/[0.06] hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-950/30"
    >
      <div className="relative aspect-square overflow-hidden">
        {art
          ? <img src={art} alt={track.trackName} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          : <div className="h-full w-full bg-gradient-to-br from-violet-900/40 to-zinc-900 grid place-items-center">
              <svg className="h-8 w-8 text-zinc-700" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
            </div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
          <svg className="h-8 w-8 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
        </div>
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-bold text-white">{track.trackName || track.collectionName}</p>
        <p className="truncate text-xs text-zinc-500 mt-0.5">{track.artistName}</p>
        {track.primaryGenreName && (
          <span className="mt-1.5 inline-block rounded-md bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-bold text-violet-400">{track.primaryGenreName}</span>
        )}
      </div>
    </a>
  );
}

const mediaTypeColors = {
  movie:  "text-rose-400 bg-rose-500/10",
  tv:     "text-violet-400 bg-violet-500/10",
  person: "text-emerald-400 bg-emerald-500/10",
  anime:  "text-cyan-400 bg-cyan-500/10",
};

/* ─── Page ───────────────────────────────────────────────────── */
export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";

  const [items,        setItems       ] = useState([]);
  const [musicItems,   setMusicItems  ] = useState([]);
  const [isLoading,    setIsLoading   ] = useState(false);
  const [musicLoading, setMusicLoading] = useState(false);

  const [typeFilter,      setTypeFilter     ] = useState("all");
  const [genreFilters,    setGenreFilters   ] = useState([]);
  const [yearFrom,        setYearFrom       ] = useState("");
  const [yearTo,          setYearTo         ] = useState("");
  const [languageFilter,  setLanguageFilter ] = useState("");
  const [minRating,       setMinRating      ] = useState(0);
  const [sort,            setSort           ] = useState("relevance");
  const [showFilters,     setShowFilters    ] = useState(false);

  /* Fetch TMDB + users */
  useEffect(() => {
    if (query.length < 2) { setItems([]); return; }
    const controller = new AbortController();
    setIsLoading(true);

    Promise.all([
      api.search(query).then(d => (d.results ?? []).filter(i => ["movie", "tv", "person"].includes(i.media_type))).catch(() => []),
      fetch(`${API}/api/users/search?query=${encodeURIComponent(query)}`).then(r => r.json()).catch(() => []),
    ])
      .then(([tmdb, users]) => {
        if (controller.signal.aborted) return;
        const formatted = (Array.isArray(users) ? users : []).map(u => ({
          id: u.username, title: u.displayName || u.username, media_type: "user",
          poster_path: u.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop",
          overview: u.bio || "",
        }));
        setItems([...tmdb, ...formatted]);
      })
      .finally(() => { if (!controller.signal.aborted) setIsLoading(false); });

    return () => controller.abort();
  }, [query]);

  /* Fetch iTunes for Music tab */
  useEffect(() => {
    if (query.length < 2) { setMusicItems([]); return; }
    setMusicLoading(true);
    Promise.all([
      fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=20&country=us`).then(r => r.json()).catch(() => ({ results: [] })),
      fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=15&country=in`).then(r => r.json()).catch(() => ({ results: [] })),
      fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=album&limit=10&country=us`).then(r => r.json()).catch(() => ({ results: [] })),
    ])
      .then(([en, hi, albums]) => {
        const all = [...(en.results ?? []), ...(hi.results ?? []), ...(albums.results ?? [])];
        const seen = new Set();
        const deduped = all.filter(t => {
          const k = t.trackId || t.collectionId;
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
        setMusicItems(deduped);
      })
      .finally(() => setMusicLoading(false));
  }, [query]);

  const displayed = useMemo(() => sortResults(
    filterResults(items, { typeFilter: typeFilter === "music" ? "all" : typeFilter, genreFilters, yearFrom, yearTo, languageFilter, minRating }),
    sort
  ), [items, typeFilter, genreFilters, yearFrom, yearTo, languageFilter, minRating, sort]);

  const toggleGenre = (id) =>
    setGenreFilters(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const langOptions = [
    { label: "All Languages", value: "" },
    ...Object.entries(tmdbLanguages).map(([code, name]) => ({ label: name, value: code })),
  ];

  const isMusic = typeFilter === "music";
  const resultCount = isMusic ? musicItems.length : displayed.length;

  return (
    <main className="min-h-screen text-white" style={{ background: "var(--bg)" }}>
      {/* Ambient glow */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_16%_0%,rgba(124,58,237,0.16),transparent_30%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05060b] via-[#020306] to-[#030509]" />
      </div>

      {/* Hide number input spinners globally on this page */}
      <style>{`
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; appearance: textfield; }
      `}</style>

      <div className="mx-auto max-w-[1680px] px-4 pb-24 pt-24 sm:px-6 lg:px-8">

        {/* ── Page header ── */}
        <div className="mb-8">
          <p className="eyebrow mb-2">Search Results</p>
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
            {query ? `"${query}"` : "Find anything"}
          </h1>
          {!isLoading && !musicLoading && resultCount > 0 && (
            <p className="mt-3 text-sm text-zinc-600">{resultCount} results found</p>
          )}
        </div>

        {/* ── Filter bar ── */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">

          {/* Type pills — modern glassmorphism */}
          <div className="flex flex-wrap gap-2">
            {typeFilters.map((f) => {
              const active = typeFilter === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => setTypeFilter(f.value)}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition-all duration-200 ${
                    active
                      ? f.value === "music"
                        ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-900/40"
                        : "bg-violet-600 text-white shadow-lg shadow-violet-900/30"
                      : "border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm text-zinc-400 hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-white"
                  }`}
                >
                  {f.value === "music" && (
                    <svg className="inline-block mr-1.5 h-3.5 w-3.5 -mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                    </svg>
                  )}
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Sort + Filter controls */}
          <div className="flex items-center gap-2">
            {/* Only show Filters button when NOT on Music tab */}
            {!isMusic && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all duration-150 ${
                  showFilters
                    ? "border-violet-500/40 bg-violet-500/10 text-violet-300"
                    : "border-white/[0.08] bg-white/[0.04] backdrop-blur-sm text-zinc-300 hover:bg-white/[0.07]"
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                {showFilters ? "Hide" : "Filters"}
              </button>
            )}

            <GlassSelect
              value={sort}
              onChange={setSort}
              options={sortOptions.map(o => ({ ...o, label: `Sort: ${o.label}` }))}
            />
          </div>
        </div>

        {/* ── Advanced filters panel ── */}
        {showFilters && !isMusic && (
          <div className="mb-8 animate-fade-up rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm p-6">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">

              {/* Genres */}
              <div className="col-span-1 lg:col-span-2">
                <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-zinc-500">Genres</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(tmdbGenres).map(([id, name]) => {
                    const numId = parseInt(id, 10);
                    const active = genreFilters.includes(numId);
                    return (
                      <button
                        key={id}
                        onClick={() => toggleGenre(numId)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                          active
                            ? "bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/30"
                            : "border border-white/[0.06] bg-white/[0.03] text-zinc-500 hover:bg-white/[0.07] hover:text-zinc-300"
                        }`}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Year + Rating */}
              <div className="space-y-6">
                <div>
                  <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-zinc-500">Year Range</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="From"
                      value={yearFrom}
                      onChange={(e) => setYearFrom(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.08] bg-black/40 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-violet-500/40 transition"
                    />
                    <span className="text-zinc-700 shrink-0">—</span>
                    <input
                      type="number"
                      placeholder="To"
                      value={yearTo}
                      onChange={(e) => setYearTo(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.08] bg-black/40 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-violet-500/40 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-3 flex justify-between text-xs font-bold uppercase tracking-wider text-zinc-500">
                    <span>Min Rating</span>
                    <span className="text-violet-400 normal-case font-black">{minRating > 0 ? `${minRating}+` : "Any"}</span>
                  </label>
                  <input
                    type="range" min="0" max="10" step="0.5"
                    value={minRating}
                    onChange={(e) => setMinRating(parseFloat(e.target.value))}
                    className="w-full accent-violet-500"
                  />
                </div>
              </div>

              {/* Language + Clear */}
              <div className="flex flex-col justify-between">
                <div>
                  <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-zinc-500">Language</label>
                  <GlassSelect value={languageFilter} onChange={setLanguageFilter} options={langOptions} />
                </div>

                <button
                  onClick={() => { setGenreFilters([]); setYearFrom(""); setYearTo(""); setLanguageFilter(""); setMinRating(0); }}
                  className="mt-6 self-end text-xs font-bold text-zinc-600 transition hover:text-zinc-300"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Content ── */}

        {/* Music tab results */}
        {isMusic && (
          <>
            {musicLoading && (
              <div className="py-20 text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-violet-500 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">Searching music…</p>
              </div>
            )}
            {!musicLoading && query.length < 2 && (
              <EmptyState icon="music" title="Search for music" sub="Type at least 2 characters to find songs and albums." />
            )}
            {!musicLoading && query.length >= 2 && musicItems.length === 0 && (
              <EmptyState icon="music" title="No music found" sub="Try a different search term." />
            )}
            {!musicLoading && musicItems.length > 0 && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
                {musicItems.map((track) => (
                  <MusicCard key={track.trackId ?? track.collectionId} track={track} />
                ))}
              </div>
            )}
          </>
        )}

        {/* TMDB / user results */}
        {!isMusic && (
          <>
            {isLoading && <SkeletonGrid />}

            {!isLoading && query.length < 2 && (
              <EmptyState icon="search" title="Start searching" sub="Type at least 2 characters to search across movies, shows & people." />
            )}

            {!isLoading && query.length >= 2 && displayed.length === 0 && (
              <EmptyState icon="empty" title="No results found" sub="Try a different search term or adjust your filters." />
            )}

            {!isLoading && displayed.length > 0 && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
                {displayed.map((item) => {
                  const poster    = item.poster_path ?? item.profile_path;
                  const typeLabel = isAnime(item) ? "anime" : item.media_type;
                  const typeStyle = mediaTypeColors[typeLabel] ?? "text-zinc-400 bg-zinc-500/10";
                  return (
                    <Link to={getResultHref(item)} className="poster-card" key={`${item.media_type}-${item.id}`}>
                      <div className="relative aspect-[2/3]">
                        {poster
                          ? <img alt="" className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" src={posterUrl(poster)} />
                          : <div className="grid h-full w-full place-items-center text-sm font-semibold text-zinc-700">No image</div>
                        }
                        <div className="absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-black/70 px-2 py-1 text-[10px] font-black text-yellow-300 backdrop-blur-md">
                          <svg className="h-2.5 w-2.5 fill-yellow-400" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                          {getRating(item)}
                        </div>
                        <div className="poster-overlay">
                          <h3 className="truncate text-sm font-bold text-white">{getTitle(item)}</h3>
                          <div className="mt-1 flex items-center gap-2">
                            <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${typeStyle}`}>{getMediaLabel(item)}</span>
                            <span className="text-[10px] text-zinc-400">{getYear(item)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="truncate text-sm font-bold text-white group-hover:text-violet-400 transition-colors">{getTitle(item)}</h3>
                        <div className="mt-1 flex items-center gap-2">
                          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${typeStyle}`}>{getMediaLabel(item)}</span>
                          <span className="text-xs text-zinc-600">{getYear(item)}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

/* ─── Empty state helper ─────────────────────────────────────── */
function EmptyState({ icon, title, sub }) {
  const icons = {
    search: <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />,
    music:  null,
    empty:  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />,
  };
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-16 text-center">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl border border-white/[0.07] bg-white/[0.04]">
        {icon === "music"
          ? <svg className="h-7 w-7 text-zinc-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
          : <svg className="h-7 w-7 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>{icons[icon]}</svg>
        }
      </div>
      <p className="text-lg font-black text-zinc-400">{title}</p>
      <p className="mt-2 text-sm text-zinc-600">{sub}</p>
    </div>
  );
}

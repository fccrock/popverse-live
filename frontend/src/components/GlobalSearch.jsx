import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { api } from "../utils/api";
import { getTitle, getYear, getMediaLabel, getRating, getResultHref, posterUrl } from "../utils/tmdb";

const API = import.meta.env.VITE_API_BASE_URL ?? "";

function SearchIcon({ className = "h-5 w-5" }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="m21 21-4.2-4.2M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z"
        stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function Spinner() {
  return <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-violet-400" />;
}

export default function GlobalSearch({ className = "" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const wrapperRef = useRef(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (location.pathname.startsWith("/music")) setFilter("music");
    else if (location.pathname.startsWith("/cinema")) setFilter("cinema");
    else setFilter("all");
  }, [location.pathname]);

  const trimmed = query.trim();
  const visible = useMemo(() => results.slice(0, 8), [results]);
  const isOpen = isFocused && trimmed.length > 1;

  useEffect(() => {
    if (trimmed.length < 2) { setResults([]); setIsLoading(false); return; }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const safeFetch = (p) => p.catch(() => ({ results: [] }));
        
        const fetchers = [];
        if (filter === "all" || filter === "cinema") {
          fetchers.push(safeFetch(api.search(trimmed)).then(d => (d.results ?? []).filter(i => ["movie", "tv", "person"].includes(i.media_type))));
        }
        if (filter === "all" || filter === "music") {
          fetchers.push(
            safeFetch(api.searchMusic(trimmed, "album")).then(d => (d.results ?? []).map(r => ({ ...r, media_type: "album" }))),
            safeFetch(api.searchMusic(trimmed, "track")).then(d => (d.results ?? []).map(r => ({ ...r, media_type: "track" })))
          );
        }
        if (filter === "all" || filter === "users") {
          fetchers.push(
            fetch(`${API}/api/users/search?query=${encodeURIComponent(trimmed)}`)
              .then(res => res.json())
              .catch(() => [])
              .then(users => (Array.isArray(users) ? users : []).map(u => ({
                id: u.username,
                title: u.displayName || u.username,
                media_type: "user",
                poster_path: u.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop",
                overview: u.bio || "",
              })))
          );
        }
        
        const resultsArray = await Promise.all(fetchers);
        let merged = resultsArray.flat();
        
        if (filter === "all") {
          // Shuffle slightly so we get a mix of movies and music at the top
          merged = merged.sort((a, b) => 0.5 - Math.random());
        }

        if (!controller.signal.aborted) {
          setResults(merged);
          setActiveIndex(-1);
        }
      } catch (_) {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 320);

    return () => { controller.abort(); clearTimeout(timer); };
  }, [trimmed, filter]);

  useEffect(() => {
    function onDown(e) {
      if (!wrapperRef.current?.contains(e.target)) { setIsFocused(false); setActiveIndex(-1); }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function goToSearch() {
    if (trimmed.length < 2) return;
    setIsFocused(false);
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  function onKeyDown(e) {
    if (e.key === "Escape") { setIsFocused(false); setActiveIndex(-1); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex((c) => Math.min(c + 1, visible.length - 1)); return; }
    if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex((c) => Math.max(c - 1, -1)); return; }
    if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && visible[activeIndex]) {
        setIsFocused(false);
        navigate(getResultHref(visible[activeIndex]));
        return;
      }
      goToSearch();
    }
  }

  const mediaTypeColors = {
    movie: "text-rose-400 bg-rose-500/10",
    tv: "text-violet-400 bg-violet-500/10",
    person: "text-emerald-400 bg-emerald-500/10",
  };

  const isLocked = location.pathname.startsWith("/music") || location.pathname.startsWith("/cinema");
  const placeholderText = filter === "music" ? "Search albums, tracks..." : filter === "cinema" ? "Search movies, shows..." : "Search movies, music, anime...";

  return (
    <div className={`relative hidden lg:block ${className}`} ref={wrapperRef}>
      {/* Search input */}
      <div className={`flex h-10 items-center gap-2.5 rounded-xl border bg-white/[0.04] px-3.5 text-zinc-500 shadow-inner shadow-black/20 backdrop-blur-xl transition-all duration-300 ${isFocused ? "w-[460px] border-violet-500/40 bg-white/[0.06] shadow-[0_0_25px_rgba(124,58,237,0.12)]" : "w-[280px] border-white/[0.08] hover:border-white/[0.12]"}`}>
        <SearchIcon className="h-4 w-4 shrink-0" />
        
        {!isLocked && (
          <button
            onClick={(e) => {
              e.preventDefault();
              setFilter(f => f === "all" ? "cinema" : f === "cinema" ? "music" : f === "music" ? "users" : "all");
            }}
            className={`text-[9px] shrink-0 uppercase font-bold px-1.5 py-0.5 rounded transition ${
              filter === "music" ? "bg-pink-500/20 text-pink-300" :
              filter === "cinema" ? "bg-orange-500/20 text-orange-300" :
              filter === "users" ? "bg-emerald-500/20 text-emerald-300" :
              "bg-white/[0.08] text-zinc-400 hover:bg-white/[0.12] hover:text-white"
            }`}
            title="Toggle Search Filter"
          >
            {filter}
          </button>
        )}

        <input
          aria-label="Search Popverse"
          className="min-w-0 flex-1 bg-transparent text-sm font-medium text-white outline-none placeholder:text-zinc-600"
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholderText}
          value={query}
        />
        {isLoading ? <Spinner /> : (
          query && (
            <button
              aria-label="Search"
              className="rounded-lg px-2 py-0.5 text-[11px] font-bold text-zinc-600 transition hover:text-zinc-300"
              onClick={goToSearch}
              type="button"
            >
              ↵
            </button>
          )
        )}
      </div>

      {/* Dropdown panel */}
      <div className={`absolute left-0 right-0 top-14 z-[80] w-full overflow-hidden rounded-2xl border border-white/[0.1] bg-zinc-90/60 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-3xl transition-all duration-200 ${isOpen ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"}`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <SearchIcon className="h-4 w-4 text-violet-400" />
            <p className="text-xs font-black uppercase tracking-[0.25em] text-violet-400">Popverse Search</p>
          </div>
          <p className="text-xs font-medium text-zinc-500 truncate max-w-[180px]">"{trimmed}"</p>
        </div>

        {isLoading && (
          <div className="space-y-2 p-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div className="flex animate-pulse gap-3 rounded-xl bg-white/[0.03] p-3" key={i}>
                <div className="h-16 w-11 rounded-lg bg-white/[0.07]" />
                <div className="flex-1 space-y-2.5 py-1">
                  <div className="h-3 w-2/3 rounded-lg bg-white/[0.07]" />
                  <div className="h-3 w-1/3 rounded-lg bg-white/[0.05]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && visible.length > 0 && (
          <div className="max-h-[520px] overflow-y-auto p-2">
            {visible.map((item, index) => {
              const isMusic = item.media_type === "album" || item.media_type === "track";
              const href = isMusic ? `/music/album/${item.collectionId}` : getResultHref(item);
              const poster = isMusic ? item.artworkUrl100?.replace("100x100bb", "185x185bb") : (item.poster_path ?? item.profile_path);
              const posterSrc = isMusic ? poster : posterUrl(poster, "w185");
              const title = isMusic ? (item.media_type === "album" ? item.collectionName : item.trackName) : getTitle(item);
              const year = isMusic ? (item.releaseDate ? item.releaseDate.substring(0, 4) : "") : getYear(item);
              const label = isMusic ? (item.media_type === "album" ? "Album" : "Track") : getMediaLabel(item);
              const typeStyle = isMusic ? "text-pink-400 bg-pink-500/10" : (mediaTypeColors[item.media_type] ?? "text-zinc-400 bg-zinc-500/10");
              const rating = isMusic ? "Music" : getRating(item);
              
              return (
                <Link
                  className={`group flex items-center gap-4 rounded-xl p-3 transition-all duration-150 ${activeIndex === index ? "bg-white/[0.08]" : "hover:bg-white/[0.06]"}`}
                  to={href}
                  key={`${item.media_type}-${item.id}`}
                  onClick={() => setIsFocused(false)}
                >
                  <div className="h-16 w-[42px] shrink-0 overflow-hidden rounded-lg bg-zinc-900 shadow-md">
                    {poster ? (
                      <img alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" src={posterSrc} />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-[10px] font-bold text-zinc-600">No art</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[15px] font-bold text-white">{title}</h3>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${typeStyle}`}>{label}</span>
                      <span className="text-xs font-medium text-zinc-500">{year}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 rounded bg-yellow-400/[0.12] px-2 py-1">
                    {isMusic ? (
                       <svg className="h-[11px] w-[11px] fill-pink-400" viewBox="0 0 24 24">
                         <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                       </svg>
                    ) : (
                      <svg className="h-[11px] w-[11px] fill-yellow-400" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    )}
                    <span className={`text-[11px] font-black ${isMusic ? 'text-pink-400' : 'text-yellow-400'}`}>{rating}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {!isLoading && trimmed.length > 1 && visible.length === 0 && (
          <div className="p-10 text-center">
            <div className="mb-3 grid h-12 w-12 mx-auto place-items-center rounded-2xl border border-white/[0.06] bg-white/[0.03]">
              <SearchIcon className="h-5 w-5 text-zinc-600" />
            </div>
            <p className="text-sm font-bold text-zinc-400">No titles found</p>
            <p className="mt-1.5 text-xs text-zinc-600">Try a different search term.</p>
          </div>
        )}

        {!isLoading && visible.length > 0 && (
          <button
            className="flex w-full items-center justify-center gap-2 border-t border-white/[0.06] px-5 py-3.5 text-sm font-semibold text-zinc-400 transition-all duration-150 hover:bg-white/[0.04] hover:text-white"
            onClick={goToSearch}
            type="button"
          >
            View all results
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

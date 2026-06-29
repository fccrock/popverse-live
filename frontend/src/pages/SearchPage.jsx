import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../utils/api";
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

const typeFilters = [
  { label: "All", value: "all" },
  { label: "Movies", value: "movie" },
  { label: "TV Shows", value: "tv" },
  { label: "Anime", value: "anime" },
  { label: "People", value: "person" },
  { label: "Users", value: "user" },
];

const sortOptions = [
  { label: "Relevance", value: "relevance" },
  { label: "Popularity", value: "popularity" },
  { label: "Rating", value: "rating" },
  { label: "Release Date", value: "release_date" },
];

function filterResults(items, { typeFilter, genreFilters, yearFrom, yearTo, languageFilter, minRating }) {
  return items.filter((item) => {
    // Type Filter
    if (typeFilter !== "all") {
      if (typeFilter === "anime") {
        if (!isAnime(item)) return false;
      } else if (item.media_type !== typeFilter) {
        return false;
      } else if (typeFilter === "tv" && isAnime(item)) {
        return false;
      }
    }

    // Person doesn't have these attributes
    if (item.media_type === "person") {
      if (genreFilters.length > 0 || yearFrom || yearTo || languageFilter || minRating > 0) {
        return false;
      }
      return true;
    }

    // Genre Filter (multi-select, match at least one)
    if (genreFilters.length > 0) {
      if (!item.genre_ids || !genreFilters.some((g) => item.genre_ids.includes(g))) {
        return false;
      }
    }

    // Year Range
    const yearStr = getYear(item);
    const year = parseInt(yearStr, 10);
    if (!isNaN(year)) {
      if (yearFrom && year < parseInt(yearFrom, 10)) return false;
      if (yearTo && year > parseInt(yearTo, 10)) return false;
    } else if (yearFrom || yearTo) {
      return false; // If filtering by year and item has no year, drop it
    }

    // Language Filter
    if (languageFilter && item.original_language !== languageFilter) {
      return false;
    }

    // Minimum Rating Filter
    if (minRating > 0) {
      const rating = parseFloat(getRating(item));
      if (isNaN(rating) || rating < minRating) return false;
    }

    return true;
  });
}

function sortResults(items, sort) {
  const itemsWithIndex = items.map((item, index) => ({ item, index }));
  
  itemsWithIndex.sort((a, b) => {
    if (sort === "relevance") return a.index - b.index;
    if (sort === "popularity") return (b.item.popularity ?? 0) - (a.item.popularity ?? 0);
    if (sort === "rating") {
      const ratingA = parseFloat(getRating(a.item)) || 0;
      const ratingB = parseFloat(getRating(b.item)) || 0;
      return ratingB - ratingA;
    }
    if (sort === "release_date") {
      const dateA = a.item.release_date ?? a.item.first_air_date ?? "";
      const dateB = b.item.release_date ?? b.item.first_air_date ?? "";
      return dateB.localeCompare(dateA);
    }
    return 0;
  });

  return itemsWithIndex.map((i) => i.item);
}

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

const mediaTypeColors = {
  movie: "text-rose-400 bg-rose-500/10",
  tv: "text-violet-400 bg-violet-500/10",
  person: "text-emerald-400 bg-emerald-500/10",
  anime: "text-cyan-400 bg-cyan-500/10",
};

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters State
  const [typeFilter, setTypeFilter] = useState("all");
  const [genreFilters, setGenreFilters] = useState([]); // Array of genre IDs
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState("relevance");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (query.length < 2) { setItems([]); return; }
    const controller = new AbortController();
    setIsLoading(true);
    
    Promise.all([
      api.search(query).then(d => (d.results ?? []).filter((i) => ["movie", "tv", "person"].includes(i.media_type))).catch(() => []),
      fetch(`http://localhost:5000/api/users/search?query=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .catch(() => [])
    ])
    .then(([tmdbData, usersData]) => {
      if (controller.signal.aborted) return;
      
      const formattedUsers = (Array.isArray(usersData) ? usersData : []).map(u => ({
        id: u.username,
        title: u.displayName || u.username,
        media_type: "user",
        poster_path: u.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop",
        overview: u.bio || "",
      }));

      setItems([...tmdbData, ...formattedUsers]);
    })
    .finally(() => {
      if (!controller.signal.aborted) setIsLoading(false);
    });

    return () => controller.abort();
  }, [query]);

  const displayed = useMemo(() => sortResults(
    filterResults(items, { typeFilter, genreFilters, yearFrom, yearTo, languageFilter, minRating }),
    sort
  ), [items, typeFilter, genreFilters, yearFrom, yearTo, languageFilter, minRating, sort]);

  const toggleGenre = (genreId) => {
    setGenreFilters((prev) =>
      prev.includes(genreId) ? prev.filter((id) => id !== genreId) : [...prev, genreId]
    );
  };

  return (
    <main className="min-h-screen text-white" style={{ background: "var(--bg)" }}>
      {/* Ambient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_16%_0%,rgba(124,58,237,0.16),transparent_30%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05060b] via-[#020306] to-[#030509]" />
      </div>

      <div className="mx-auto max-w-[1680px] px-4 pb-24 pt-10 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-10">
          <p className="eyebrow mb-2">Search results</p>
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
            {query ? `"${query}"` : "Find anything"}
          </h1>
          {!isLoading && items.length > 0 && (
            <p className="mt-3 text-sm text-zinc-600">{displayed.length} results found</p>
          )}
        </div>

        {/* Filter bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          {/* Type pills */}
          <div className="flex flex-wrap gap-2">
            {typeFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setTypeFilter(f.value)}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition-all duration-150 ${
                  typeFilter === f.value
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-900/30"
                    : "border border-white/[0.07] bg-white/[0.04] text-zinc-400 hover:border-white/[0.12] hover:bg-white/[0.07] hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all duration-150 ${
                showFilters
                  ? "border-violet-500/40 bg-violet-500/10 text-violet-300"
                  : "border-white/[0.08] bg-white/[0.04] text-zinc-300 hover:bg-white/[0.07]"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {showFilters ? "Hide" : "Filters"}
            </button>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-xl border border-white/[0.08] bg-[#0a0c14] px-3 py-2 text-sm font-semibold text-zinc-300 outline-none focus:border-violet-500/40 transition"
            >
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>Sort: {opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="mb-8 animate-fade-up rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-sm">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              {/* Genres */}
              <div className="col-span-1 lg:col-span-2">
                <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-zinc-500">Genres</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(tmdbGenres).map(([id, name]) => {
                    const numId = parseInt(id, 10);
                    const isActive = genreFilters.includes(numId);
                    return (
                      <button
                        key={id}
                        onClick={() => toggleGenre(numId)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                          isActive
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

              {/* Year Range & Minimum Rating */}
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
                    <span className="text-zinc-700">—</span>
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
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={minRating}
                    onChange={(e) => setMinRating(parseFloat(e.target.value))}
                    className="w-full accent-violet-500"
                  />
                </div>
              </div>

              {/* Language */}
              <div className="flex flex-col justify-between">
                <div>
                  <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-zinc-500">Language</label>
                  <select
                    value={languageFilter}
                    onChange={(e) => setLanguageFilter(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-black/40 px-4 py-2.5 text-sm font-semibold text-zinc-200 outline-none focus:border-violet-500/40 transition"
                  >
                    <option value="">All Languages</option>
                    {Object.entries(tmdbLanguages).map(([code, name]) => (
                      <option key={code} value={code}>{name}</option>
                    ))}
                  </select>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => {
                      setGenreFilters([]);
                      setYearFrom("");
                      setYearTo("");
                      setLanguageFilter("");
                      setMinRating(0);
                    }}
                    className="text-xs font-bold text-zinc-600 transition hover:text-zinc-300"
                  >
                    Clear all filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {isLoading && <SkeletonGrid />}

        {!isLoading && query.length < 2 && (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-16 text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl border border-white/[0.07] bg-white/[0.04]">
              <svg className="h-7 w-7 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
            <p className="text-lg font-black text-zinc-400">Start searching</p>
            <p className="mt-2 text-sm text-zinc-600">Type at least 2 characters to search across movies, shows & people.</p>
          </div>
        )}

        {!isLoading && query.length >= 2 && displayed.length === 0 && (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-16 text-center">
            <p className="text-lg font-black text-zinc-400">No results found</p>
            <p className="mt-2 text-sm text-zinc-600">Try a different search term or adjust your filters.</p>
          </div>
        )}

        {!isLoading && displayed.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {displayed.map((item) => {
              const poster = item.poster_path ?? item.profile_path;
              const typeLabel = isAnime(item) ? "anime" : item.media_type;
              const typeStyle = mediaTypeColors[typeLabel] ?? "text-zinc-400 bg-zinc-500/10";
              return (
                <Link
                  to={getResultHref(item)}
                  className="poster-card"
                  key={`${item.media_type}-${item.id}`}
                >
                  <div className="relative aspect-[2/3]">
                    {poster ? (
                      <img alt="" className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" src={posterUrl(poster)} />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-sm font-semibold text-zinc-700">No image</div>
                    )}
                    {/* Rating */}
                    <div className="absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-black/70 px-2 py-1 text-[10px] font-black text-yellow-300 backdrop-blur-md">
                      <svg className="h-2.5 w-2.5 fill-yellow-400" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
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
      </div>
    </main>
  );
}

import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";
import { posterUrl, getTitle, getYear, getRating, tmdbGenres } from "../utils/tmdb";

function MovieCard({ item }) {
  return (
    <Link
      to={`/cinema/${item.id}`}
      className="group relative flex flex-col gap-3 transition-transform duration-300 hover:scale-[1.03]"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-zinc-900 shadow-xl ring-1 ring-white/10 transition-shadow duration-300 group-hover:shadow-2xl group-hover:shadow-violet-900/30">
        <img
          src={posterUrl(item.poster_path, "w500")}
          alt={getTitle(item)}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" />
      </div>
      <div className="px-1">
        <h3 className="truncate text-base font-bold text-white group-hover:text-violet-400 transition-colors">
          {getTitle(item)}
        </h3>
        <div className="mt-1 flex items-center gap-3 text-xs font-semibold text-zinc-400">
          <span className="flex items-center gap-1 text-yellow-500">
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            {getRating(item)}
          </span>
          <span>{getYear(item)}</span>
          <span>New Movie</span>
        </div>
      </div>
    </Link>
  );
}

function MovieGrid({ title, items, icon, limit }) {
  if (items.length === 0) {
    return (
      <div className="mb-14 px-6 sm:px-10 lg:px-14 xl:px-16">
        <h2 className="mb-6 flex items-center gap-2.5 text-2xl font-black tracking-tight text-white">
          {icon} {title}
        </h2>
        <p className="text-zinc-500">No movies found matching these filters.</p>
      </div>
    );
  }

  const displayedItems = limit ? items.slice(0, limit) : items;

  return (
    <div className="mb-14 px-6 sm:px-10 lg:px-14 xl:px-16">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2.5 text-2xl font-black tracking-tight text-white">
          {icon} {title}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {displayedItems.map((item) => (
          <MovieCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}



function CustomDropdown({ label, value, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption && selectedOption.value !== "" ? selectedOption.label : label;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all backdrop-blur-md outline-none ${
          isOpen
            ? "border-violet-500/50 bg-white/[0.06] text-white ring-1 ring-violet-500/50"
            : "border-white/[0.08] bg-black/40 text-zinc-300 hover:border-violet-500/40 hover:bg-white/[0.04] hover:text-white"
        }`}
      >
        {displayLabel}
        <svg 
          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180 text-violet-400" : "opacity-70"}`} 
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-56 z-50 animate-fade-in-up rounded-xl border border-white/[0.1] bg-[#0a0c14]/95 p-1.5 shadow-2xl backdrop-blur-xl ring-1 ring-black/50 overflow-hidden">
          <div className="max-h-60 overflow-y-auto hide-scrollbar">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  value === opt.value
                    ? "bg-violet-500/10 text-violet-300"
                    : "text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {opt.label}
                {value === opt.value && (
                  <svg className="h-4 w-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MoviesPage() {
  const [trending, setTrending] = useState([]);
  const [topRated, setTopRated] = useState([]);

  // Functional Filter States
  const [genreFilter, setGenreFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [sortFilter, setSortFilter] = useState("popularity");

  useEffect(() => {
    // Fetch bigger arrays if possible, but standard endpoints return 20.
    api.getTrendingMovies().then((data) => setTrending(data.results || []));
    api.getTopRatedMovies().then((data) => setTopRated(data.results || []));
  }, []);

  // Filter Logic derived from SearchPage
  const filterAndSort = (items) => {
    let result = items.filter((item) => {
      // Genre Filter
      if (genreFilter && (!item.genre_ids || !item.genre_ids.includes(parseInt(genreFilter)))) {
        return false;
      }
      // Year Filter
      if (yearFilter) {
        if (getYear(item) !== yearFilter) return false;
      }
      // Rating Filter
      if (ratingFilter) {
        const rating = parseFloat(getRating(item));
        const min = parseFloat(ratingFilter);
        if (isNaN(rating) || rating < min) return false;
      }
      return true;
    });

    // Sort Logic
    result.sort((a, b) => {
      if (sortFilter === "popularity") return (b.popularity ?? 0) - (a.popularity ?? 0);
      if (sortFilter === "rating") {
        return (parseFloat(getRating(b)) || 0) - (parseFloat(getRating(a)) || 0);
      }
      if (sortFilter === "release_date") {
        return (b.release_date ?? "").localeCompare(a.release_date ?? "");
      }
      return 0;
    });

    return result;
  };

  const filteredTrending = useMemo(() => filterAndSort(trending), [trending, genreFilter, yearFilter, ratingFilter, sortFilter]);
  const filteredTopRated = useMemo(() => filterAndSort(topRated), [topRated, genreFilter, yearFilter, ratingFilter, sortFilter]);

  return (
    <main className="min-h-screen text-white pb-24 relative z-0">
      {/* Premium Ambient Background matching 2nd reference */}
      <div className="fixed inset-0 -z-10 bg-[#050505]">
        <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-[#2d1238] via-[#14081c] to-transparent opacity-90" />
      </div>

      <div className="mx-auto max-w-[1840px] pt-24 sm:pt-32">
        {/* Header Section */}
        <div className="mb-10 px-6 sm:px-10 lg:px-14 xl:px-16">
          <h1 
            className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl drop-shadow-md"
            style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}
          >
            Movies
          </h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base font-medium text-zinc-300">
            Discover, explore and enjoy the best of movies.
          </p>
        </div>

        {/* Filter Bar - Now Fully Functional & Premium! */}
        <div className="mb-14 px-6 sm:px-10 lg:px-14 xl:px-16">
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Genre Dropdown */}
            <CustomDropdown 
              label="Genre (All)"
              value={genreFilter}
              onChange={setGenreFilter}
              options={[
                { value: "", label: "All Genres" },
                ...Object.entries(tmdbGenres).map(([id, name]) => ({ value: id, label: name }))
              ]}
            />

            {/* Year Dropdown */}
            <CustomDropdown 
              label="Year (Any)"
              value={yearFilter}
              onChange={setYearFilter}
              options={[
                { value: "", label: "Any Year" },
                ...[2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018].map(y => ({ value: y.toString(), label: y.toString() }))
              ]}
            />

            {/* Rating Dropdown */}
            <CustomDropdown 
              label="Rating (Any)"
              value={ratingFilter}
              onChange={setRatingFilter}
              options={[
                { value: "", label: "Any Rating" },
                { value: "9", label: "9.0+ Excellent" },
                { value: "8", label: "8.0+ Great" },
                { value: "7", label: "7.0+ Good" },
              ]}
            />

            {/* Sort Dropdown */}
            <CustomDropdown 
              label="Sort By"
              value={sortFilter}
              onChange={setSortFilter}
              options={[
                { value: "popularity", label: "Popularity" },
                { value: "rating", label: "Rating" },
                { value: "release_date", label: "Newest" },
              ]}
            />

          </div>
        </div>

        {/* Rails / Grids */}
        
        {/* Talk of the Town */}
        <MovieGrid 
          title="Talk Of The Town" 
          items={filteredTrending} 
          limit={12}
          icon={
            <svg className="h-6 w-6 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          }
        />
        
        {/* Popverse Select */}
        <MovieGrid 
          title="Popverse Select" 
          items={filteredTopRated} 
          icon={
            <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
        />
        
      </div>
    </main>
  );
}

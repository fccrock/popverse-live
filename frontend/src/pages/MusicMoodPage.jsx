// src/pages/MusicMoodPage.jsx
import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";

// Mood → iTunes search terms (English + Hindi)
const MOOD_CONFIG = {
  chill: {
    label: "Chill",
    color: "#60a5fa",
    gradient: "from-blue-900/60 via-slate-900 to-black",
    img: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=300&fit=crop&q=80",
    searches: [
      { term: "chill lofi beats", country: "us" },
      { term: "chill vibes playlist", country: "us" },
      { term: "arijit singh chill", country: "in" },
      { term: "lo-fi hindi songs", country: "in" },
    ],
  },
  focus: {
    label: "Focus",
    color: "#a78bfa",
    gradient: "from-violet-900/60 via-slate-900 to-black",
    img: "https://images.unsplash.com/photo-1499728603263-13726abce5fd?w=800&h=300&fit=crop&q=80",
    searches: [
      { term: "deep focus study music", country: "us" },
      { term: "instrumental concentration", country: "us" },
      { term: "hindi instrumental focus", country: "in" },
      { term: "ar rahman instrumental", country: "in" },
    ],
  },
  workout: {
    label: "Workout",
    color: "#f87171",
    gradient: "from-red-900/60 via-slate-900 to-black",
    img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=300&fit=crop&q=80",
    searches: [
      { term: "gym workout motivation", country: "us" },
      { term: "hip hop workout songs", country: "us" },
      { term: "hindi workout songs", country: "in" },
      { term: "bollywood dance hits", country: "in" },
    ],
  },
  sad: {
    label: "Sad",
    color: "#94a3b8",
    gradient: "from-slate-800/60 via-slate-900 to-black",
    img: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&h=300&fit=crop&q=80",
    searches: [
      { term: "sad songs heartbreak", country: "us" },
      { term: "emotional acoustic ballad", country: "us" },
      { term: "arijit singh sad songs", country: "in" },
      { term: "hindi sad songs 2024", country: "in" },
    ],
  },
  party: {
    label: "Party",
    color: "#fb923c",
    gradient: "from-orange-900/60 via-slate-900 to-black",
    img: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=300&fit=crop&q=80",
    searches: [
      { term: "party hits 2024 dance", country: "us" },
      { term: "edm club songs", country: "us" },
      { term: "bollywood party songs 2024", country: "in" },
      { term: "hindi dance floor hits", country: "in" },
    ],
  },
  romance: {
    label: "Romance",
    color: "#f472b6",
    gradient: "from-pink-900/60 via-slate-900 to-black",
    img: "https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=800&h=300&fit=crop&q=80",
    searches: [
      { term: "romantic love songs 2024", country: "us" },
      { term: "soft pop love songs", country: "us" },
      { term: "hindi romantic songs arijit", country: "in" },
      { term: "bollywood love songs 2024", country: "in" },
    ],
  },
};

async function fetchMoodSongs(searches) {
  const results = await Promise.all(
    searches.map(({ term, country }) =>
      fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=15&country=${country}`
      )
        .then((r) => r.json())
        .then((d) => (d.results ?? []).map((s) => ({ ...s, _country: country })))
        .catch(() => [])
    )
  );
  const flat = results.flat();
  // Deduplicate by trackId
  const seen = new Set();
  const merged = [];
  for (const s of flat) {
    if (s.trackId && !seen.has(s.trackId)) {
      seen.add(s.trackId);
      merged.push(s);
    }
  }
  // Separate English and Hindi songs
  const hindi = merged.filter(
    (s) =>
      s.primaryGenreName?.toLowerCase().includes("bollywood") ||
      s.primaryGenreName?.toLowerCase().includes("hindi") ||
      s._country === "in"
  );
  const english = merged.filter((s) => !hindi.includes(s));
  return { hindi: hindi.slice(0, 15), english: english.slice(0, 20) };
}

function SongRow({ song, index }) {
  const art = song.artworkUrl100?.replace("100x100bb", "60x60bb");
  return (
    <a
      href={song.trackViewUrl || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/5 transition-all group"
    >
      <span className="text-xs font-bold text-white/30 w-5 text-right shrink-0 group-hover:text-white/60 transition-colors">
        {index + 1}
      </span>
      <div className="h-11 w-11 rounded-lg overflow-hidden shrink-0 bg-zinc-800">
        {art && (
          <img src={art} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate group-hover:text-white transition-colors">
          {song.trackName || "Unknown Track"}
        </p>
        <p className="text-xs text-zinc-500 truncate mt-0.5">
          {song.artistName} · {song.collectionName}
        </p>
      </div>
      <div className="shrink-0 flex items-center gap-3">
        {song.primaryGenreName && (
          <span className="hidden sm:block text-[10px] font-semibold text-zinc-600 bg-white/5 px-2 py-0.5 rounded-full">
            {song.primaryGenreName}
          </span>
        )}
        <svg
          className="h-4 w-4 text-zinc-600 group-hover:text-white transition-colors"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </div>
    </a>
  );
}

export default function MusicMoodPage() {
  const { mood } = useParams();
  const navigate = useNavigate();
  const config = MOOD_CONFIG[mood?.toLowerCase()];

  const [songs, setSongs] = useState({ hindi: [], english: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!config) return;
    setLoading(true);
    fetchMoodSongs(config.searches)
      .then((data) => {
        setSongs(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [mood]);

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#08090c] text-white">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">Mood not found</p>
          <Link to="/music" className="text-violet-400 hover:underline">← Back to Music</Link>
        </div>
      </div>
    );
  }

  const allSongs = [...songs.english, ...songs.hindi];
  const displayed = activeTab === "all" ? allSongs : activeTab === "english" ? songs.english : songs.hindi;

  return (
    <main className="min-h-screen text-white" style={{ background: "#08090c" }}>
      {/* Hero Banner */}
      <div className="relative h-52 overflow-hidden">
        <img src={config.img} alt={config.label} className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale" />
        <div className={`absolute inset-0 bg-gradient-to-b ${config.gradient}`} />
        <div className="relative z-10 h-full flex flex-col justify-end px-6 pb-6 pt-24 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Link
              to="/music"
              className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Music
            </Link>
            <span className="text-zinc-600 text-xs">/</span>
            <span className="text-xs font-medium text-zinc-400">Browse by Vibe</span>
          </div>
          <h1
            className="text-4xl font-black tracking-tight"
            style={{ color: config.color }}
          >
            {config.label}
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            {allSongs.length > 0 ? `${allSongs.length} songs` : "Loading songs..."} · English & Hindi
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Language tabs */}
        <div className="flex items-center gap-1 mb-6">
          {[
            { id: "all", label: "All", count: allSongs.length },
            { id: "english", label: "English", count: songs.english.length },
            { id: "hindi", label: "Hindi", count: songs.hindi.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-white/10 text-white"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
              }`}
            >
              {tab.label}
              <span
                className={`text-xs rounded-md px-1.5 py-0.5 font-semibold ${
                  activeTab === tab.id ? "bg-white/15 text-white/80" : "bg-white/5 text-zinc-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Songs list */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
          {loading ? (
            <div className="py-16 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-violet-500 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">Loading songs...</p>
            </div>
          ) : displayed.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-zinc-500">No songs found for this mood.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {displayed.map((song, i) => (
                <SongRow key={song.trackId} song={song} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Credit */}
        <p className="text-center text-xs text-zinc-700 mt-6">
          Songs sourced from iTunes · Click any song to open in Apple Music
        </p>
      </div>
    </main>
  );
}

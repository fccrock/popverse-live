// src/pages/MovieDetailPage.jsx
// CHANGES FROM ORIGINAL:
//   1. Import useCollections + useState + CollectionModal
//   2. CTA buttons wired to watchlist toggle and collection modal
//   3. CollectionModal rendered at bottom of return
// Everything else is identical to the original.

import { useState } from "react";
import ReviewSection from "../components/ReviewSection";
import CollectionModal from "../components/CollectionModal";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import TrailerModal from "../components/TrailerModal";
import { useFetch } from "../hooks/useFetch";
import { api } from "../utils/api";
import { posterUrl, backdropUrl, minutesToRuntime } from "../utils/tmdb";
import { useCollections } from "../context/CollectionsContext";
import { useAuth } from "../context/AuthContext";

const imageBase = "https://image.tmdb.org/t/p";

function rating(v) { return v ? v.toFixed(1) : "NR"; }
function year(date) { return date?.slice(0, 4) ?? "TBA"; }

function getTrailer(videos) {
  const yt = (videos?.results ?? []).filter((v) => v.site === "YouTube");
  const isBad = (v) => /short|clip|scene|fan|recap|promo|tv spot/i.test(`${v.name} ${v.type}`);
  const byQuality = (a, b) => {
    const sd = (b.size ?? 0) - (a.size ?? 0);
    return sd !== 0 ? sd : new Date(b.published_at ?? 0) - new Date(a.published_at ?? 0);
  };
  const official = yt.filter((v) => v.official && v.type === "Trailer" && !isBad(v));
  if (official.length) return official.sort(byQuality)[0];
  const teasers = yt.filter((v) => v.official && v.type === "Teaser" && !isBad(v));
  if (teasers.length) return teasers.sort(byQuality)[0];
  return yt.filter((v) => v.type === "Trailer" && !isBad(v)).sort(byQuality)[0];
}

function getProviders(movie) {
  const results = movie?.["watch/providers"]?.results;
  if (!results) return [];
  const region = results.IN ?? results.US ?? results.GB ?? Object.values(results)[0];
  return region?.flatrate ?? region?.rent ?? region?.buy ?? [];
}

function getProviderLink(title, providerName) {
  const q = encodeURIComponent(title);
  const p = providerName.toLowerCase();
  if (p.includes("netflix"))                          return `https://www.netflix.com/search?q=${q}`;
  if (p.includes("prime"))                            return `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${q}`;
  if (p.includes("disney") || p.includes("hotstar")) return `https://www.hotstar.com/in/search?q=${q}`;
  if (p.includes("apple"))                            return `https://tv.apple.com/search?term=${q}`;
  if (p.includes("youtube"))                          return `https://www.youtube.com/results?search_query=${q}`;
  return `https://www.justwatch.com/in/search?q=${encodeURIComponent(`${title} ${providerName}`)}`;
}

function getVibes(movie) {
  const tags = (movie.genres ?? []).map((g) => g.name).slice(0, 4);
  if ((movie.runtime ?? 0) >= 150) tags.push("Epic");
  if (movie.vote_average >= 8) tags.push("Audience Favorite");
  tags.push("Cinematic");
  return tags.slice(0, 7);
}

function getBadges(movie) {
  const badges = ["Popverse Select"];
  if (movie.vote_average >= 8) badges.unshift("Top Rated");
  if ((movie.runtime ?? 0) >= 140) badges.push("Big Screen Energy");
  return badges;
}

export default function MovieDetailPage() {
  const { id } = useParams();
  const { data: movie, loading, error } = useFetch(() => api.getMovieDetails(id), [id]);

  // ── Collections state ───────────────────────────────────────────────────────
  const { toggleWatchedGlobally, isWatchedGlobally } = useCollections();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [modalOpen, setModalOpen] = useState(false);

  const handleWatchedClick = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location } });
      return;
    }
    toggleWatchedGlobally(mediaItem);
  };

  const handleCollectionClick = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location } });
      return;
    }
    setModalOpen(true);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#030509] text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-rose-400" />
            <p className="text-sm text-zinc-600 animate-pulse">Loading...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !movie) {
    return (
      <main className="min-h-screen bg-[#030509] px-5 py-8 text-white">
        <div className="mx-auto max-w-3xl rounded-2xl border border-white/[0.07] bg-white/[0.03] p-10 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-rose-400 mb-3">Cinema</p>
          <h1 className="text-3xl font-black">Movie unavailable</h1>
          <p className="mt-3 text-zinc-500 text-sm">{error ?? "Check your TMDb token and try again."}</p>
          <Link className="mt-7 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-bold shadow-lg shadow-rose-900/30 transition hover:-translate-y-0.5 hover:bg-rose-500" to="/cinema">
            ← Back to cinema
          </Link>
        </div>
      </main>
    );
  }

  const trailer   = getTrailer(movie.videos);
  const providers = getProviders(movie);
  const cast      = movie.credits?.cast.slice(0, 12) ?? [];
  const vibes     = getVibes(movie);
  const badges    = getBadges(movie);
  const country   = movie.production_countries?.[0]?.iso_3166_1 ?? "Global";
  const language  = movie.spoken_languages?.[0]?.english_name ?? "Unknown";

  // ── Build the media item object for collections ─────────────────────────────
  const mediaItem = {
    mediaId:    `movie-${id}`,
    mediaType:  "movie",
    title:      movie.title,
    posterPath: movie.poster_path,
    year:       year(movie.release_date),
  };

  const isWatched = isWatchedGlobally(mediaItem.mediaId);

  return (
    <main className="min-h-screen text-white" style={{ background: "var(--bg)" }}>
      {/* Ambient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_12%_0%,rgba(124,58,237,0.14),transparent_30%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05060a] via-[#020306] to-[#050608]" />
      </div>


      <section className="relative min-h-[660px] overflow-hidden">
        {movie.backdrop_path && (
          <img alt="" className="absolute inset-0 h-full w-full object-cover opacity-75" src={backdropUrl(movie.backdrop_path)} />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/98 via-black/55 to-black/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030509] via-black/40 to-black/30" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#030509] to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_65%_40%,rgba(244,63,94,0.10),transparent_40%)]" />

        <TrailerModal accent="rose" title={movie.title} trailerKey={trailer?.key} />

        <div className="relative mx-auto grid min-h-[660px] max-w-[1600px] items-end gap-10 px-5 pb-16 pt-28 sm:px-8 lg:grid-cols-[240px_minmax(0,1fr)_360px] lg:px-16 xl:px-20">
          {/* Poster */}
          <div className="w-36 overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900 shadow-2xl shadow-black/80 ring-1 ring-white/[0.05] sm:w-48 lg:w-full">
            {movie.poster_path
              ? <img alt="" className="aspect-[2/3] h-full w-full object-cover" src={posterUrl(movie.poster_path)} />
              : <div className="grid aspect-[2/3] place-items-center text-zinc-600 text-sm">No poster</div>
            }
          </div>

          {/* Info */}
          <div className="max-w-4xl pb-2 animate-fade-up">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-rose-400">Movie</span>
              <span className="text-zinc-700">·</span>
              <span className="text-[11px] font-semibold text-zinc-500">{year(movie.release_date)}</span>
              <span className="text-zinc-700">·</span>
              <span className="text-[11px] font-semibold text-zinc-500">{minutesToRuntime(movie.runtime)}</span>
            </div>
            <h1 className="text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">{movie.title}</h1>

            {/* Metadata grid */}
            <div className="mt-8 grid max-w-3xl grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4">
              {[
                { label: "Rating", value: rating(movie.vote_average), color: "text-yellow-300", icon: "★" },
                { label: "Country", value: country, color: "text-white" },
                { label: "Language", value: language, color: "text-white" },
                { label: "Age Rating", value: "13+", color: "text-white" },
              ].map(({ label, value, color, icon }) => (
                <div key={label} className="group">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">{label}</p>
                  <p className={`mt-1.5 text-base font-black ${color}`}>
                    {icon && <span className="mr-1 opacity-80">{icon}</span>}{value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── CTA buttons — WIRED ── */}
          <aside className="space-y-2.5 self-end pb-2">
            {/* Watched toggle */}
            <button
              className={`flex w-full items-center justify-center gap-2.5 rounded-xl px-5 py-3.5 text-sm font-bold shadow-xl transition-all duration-200 hover:-translate-y-0.5 ${
                isWatched
                  ? "bg-violet-500 shadow-violet-900/40 hover:bg-violet-400"
                  : "bg-violet-600 shadow-violet-900/40 hover:bg-violet-500"
              }`}
              onClick={handleWatchedClick}
            >
              {isWatched ? (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Marked as Watched
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Mark as Watched
                </>
              )}
            </button>

            {/* Add to Collection */}
            <button
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/[0.1] bg-white/[0.06] px-5 py-3.5 text-sm font-bold text-zinc-100 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.16] hover:bg-white/[0.10]"
              onClick={handleCollectionClick}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Add to Collection
            </button>

            {/* View all collections link */}
            <Link
              className="block text-center text-xs font-semibold text-zinc-600 transition hover:text-zinc-400"
              to="/collections"
            >
              View my collections →
            </Link>
          </aside>
        </div>
      </section>

      {/* ── Body ── */}
      <section className="mx-auto grid max-w-[1600px] gap-12 px-5 pb-28 sm:px-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-16 xl:px-20">
        <div className="min-w-0">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {badges.map((badge) => (
              <span className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3.5 py-1.5 text-xs font-bold text-zinc-300 shadow-lg shadow-black/20" key={badge}>{badge}</span>
            ))}
          </div>

          {/* Overview */}
          <section className="mt-10">
            <h2 className="text-2xl font-black tracking-tight text-white">Overview</h2>
            <p className="mt-5 max-w-5xl text-base leading-8 text-zinc-400">{movie.overview || "No overview available."}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {vibes.map((tag) => (
                <span className="rounded-lg border border-white/[0.07] bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold text-zinc-400 transition hover:border-white/[0.12] hover:bg-white/[0.07] hover:text-zinc-200 cursor-default" key={tag}>{tag}</span>
              ))}
            </div>
          </section>

          {/* Cast */}
          {cast.length > 0 && (
            <section className="mt-12 border-t border-white/[0.06] pt-10">
              <div className="mb-7 flex items-end justify-between gap-4">
                <h2 className="text-2xl font-black tracking-tight text-white">Cast</h2>
                <p className="hidden text-xs font-semibold text-zinc-600 sm:block">← swipe →</p>
              </div>
              <div className="-mx-5 flex gap-8 overflow-x-auto px-5 pb-6 [scrollbar-width:thin] [scrollbar-color:rgba(124,58,237,0.3)_transparent]">
                {cast.map((member) => (
                  <article className="group/cast w-28 shrink-0 text-center" key={member.id}>
                    <div className="mx-auto h-28 w-28 overflow-hidden rounded-full border border-white/[0.07] bg-zinc-900 shadow-xl shadow-black/30 ring-1 ring-white/[0.04] transition-all duration-300 group-hover/cast:-translate-y-1.5 group-hover/cast:border-rose-400/50 group-hover/cast:shadow-rose-900/20">
                      {member.profile_path
                        ? <img alt="" className="h-full w-full object-cover" src={`${imageBase}/w185${member.profile_path}`} />
                        : <div className="grid h-full w-full place-items-center text-xs font-bold text-zinc-600">No img</div>
                      }
                    </div>
                    <h3 className="mt-3 text-sm font-bold leading-tight text-white">{member.name}</h3>
                    <p className="mt-0.5 text-xs leading-5 text-zinc-600">{member.character}</p>
                  </article>
                ))}
              </div>
            </section>
          )}
          <ReviewSection mediaId={`movie-${id}`} accentColor="rose" />
        </div>

        {/* ── Sidebar ── */}
        <aside className="space-y-6">
          {/* Vibe Chart */}
          <div className="card p-6">
            <h2 className="text-lg font-black text-white">Vibe Chart</h2>
            <div className="mt-6 grid place-items-center">
              <div className="grid h-52 w-52 place-items-center rounded-full bg-[conic-gradient(#06b6d4_0_42%,#7c3aed_42%_62%,#f97316_62%_82%,#e11d48_82%_100%)] p-7 shadow-2xl shadow-black/50">
                <div className="grid h-full w-full place-items-center rounded-full bg-[#0e1018] text-center">
                  <div>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{movie.genres?.[0]?.name ?? "Cinema"}</p>
                    <p className="mt-1 text-3xl font-black text-white">{Math.round(movie.vote_average * 10)}%</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-7 space-y-3.5 text-sm">
              {vibes.slice(0, 4).map((tag, i) => (
                <div className="flex items-center justify-between" key={tag}>
                  <span className="font-semibold text-zinc-400">{tag}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 rounded-full bg-white/[0.07] overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-rose-500 transition-all duration-700" style={{ width: `${45 - i * 8}%` }} />
                    </div>
                    <span className="w-8 text-right text-xs font-black text-zinc-400">{45 - i * 8}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Watch Online */}
          <div className="card p-6">
            <h2 className="text-lg font-black text-white">Watch Online</h2>
            {providers.length > 0 ? (
              <div className="mt-5 space-y-2">
                {providers.slice(0, 4).map((provider) => (
                  <a
                    className="group/provider flex items-center gap-3.5 rounded-xl border border-white/[0.05] bg-black/20 p-3 transition-all hover:-translate-y-0.5 hover:border-white/[0.10] hover:bg-white/[0.06]"
                    href={getProviderLink(movie.title, provider.provider_name)}
                    key={provider.provider_id}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {provider.logo_path
                      ? <img alt="" className="h-10 w-10 rounded-xl object-cover shadow-lg transition group-hover/provider:scale-105" src={`${imageBase}/w92${provider.logo_path}`} />
                      : <div className="h-10 w-10 rounded-xl bg-zinc-800" />
                    }
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">{provider.provider_name}</p>
                      <p className="text-xs text-zinc-600">Stream now</p>
                    </div>
                    <svg className="h-4 w-4 text-zinc-600 transition group-hover/provider:text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </a>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-zinc-600">Streaming providers are not listed for this title in your TMDb region yet.</p>
            )}
          </div>
        </aside>
      </section>

      {/* ── Collection modal ── */}
      <CollectionModal
        accentColor="rose"
        isOpen={modalOpen}
        mediaItem={mediaItem}
        onClose={() => setModalOpen(false)}
      />
    </main>
  );
}

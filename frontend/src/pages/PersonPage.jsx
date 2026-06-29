// src/pages/PersonPage.jsx
import { Link, useParams } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { api } from "../utils/api";
import { posterUrl, getTitle, getYear } from "../utils/tmdb";

const imageBase = "https://image.tmdb.org/t/p";

export default function PersonPage() {
  const { id } = useParams();
  const { data: person, loading, error } = useFetch(() => api.getPersonDetails(id), [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#030509] text-white">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-violet-400" />
          <p className="text-sm text-zinc-600 animate-pulse">Loading...</p>
        </div>
      </main>
    );
  }

  if (error || !person) {
    return (
      <main className="min-h-screen bg-[#030509] px-5 py-8 text-white">
        <div className="mx-auto max-w-3xl rounded-2xl border border-white/[0.07] bg-white/[0.03] p-10 text-center">
          <h1 className="text-3xl font-black text-white">Person not found</h1>
          <p className="mt-3 text-sm text-zinc-500">{error}</p>
          <Link className="mt-7 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-bold shadow-lg shadow-violet-900/30 transition hover:-translate-y-0.5 hover:bg-violet-500" to="/">
            ← Go home
          </Link>
        </div>
      </main>
    );
  }

  // Genre IDs to exclude: Talk (10767), News (10763), Reality (10764)
  const EXCLUDED_GENRES = new Set([10767, 10763, 10764]);

  const knownFor = (person.combined_credits?.cast || [])
    .filter((c) => c.poster_path && (c.vote_count ?? 0) >= 100)
    .filter((c) => {
      const genres = c.genre_ids || [];
      if (genres.some((g) => EXCLUDED_GENRES.has(g))) return false;
      // For TV, exclude guest appearances (1–2 episodes)
      if (c.media_type === 'tv' && (c.episode_count ?? 0) < 3) return false;
      return true;
    })
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
    .slice(0, 8);

  return (
    <main className="min-h-screen text-white" style={{ background: "var(--bg)" }}>
      {/* Ambient bg */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_12%_0%,rgba(124,58,237,0.14),transparent_30%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05060a] via-[#020306] to-[#050608]" />
      </div>



      <div className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8">
        {/* Person hero */}
        <div className="flex flex-col gap-10 sm:flex-row">
          <div className="w-44 shrink-0 sm:w-56">
            {person.profile_path ? (
              <img
                alt={person.name}
                className="w-full rounded-2xl border border-white/[0.08] object-cover shadow-2xl shadow-black/60 ring-1 ring-white/[0.05]"
                src={`${imageBase}/w342${person.profile_path}`}
              />
            ) : (
              <div className="grid aspect-[2/3] w-full place-items-center rounded-2xl border border-white/[0.07] bg-zinc-900 text-sm text-zinc-600">No photo</div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="eyebrow mb-2">Person</p>
            <h1 className="mt-1 text-4xl font-black tracking-tight text-white sm:text-5xl">{person.name}</h1>
            {person.known_for_department && (
              <span className="mt-3 inline-flex items-center rounded-xl border border-violet-500/20 bg-violet-500/10 px-3.5 py-1.5 text-sm font-semibold text-violet-300">
                {person.known_for_department}
              </span>
            )}
            {person.birthday && (
              <p className="mt-5 flex items-center gap-2 text-sm text-zinc-500">
                <svg className="h-4 w-4 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Born {new Date(person.birthday).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                {person.place_of_birth && ` · ${person.place_of_birth}`}
              </p>
            )}
            {person.biography && (
              <p className="mt-6 max-w-3xl text-sm leading-8 text-zinc-400 line-clamp-6">{person.biography}</p>
            )}
          </div>
        </div>

        {/* Known For */}
        {knownFor.length > 0 && (
          <section className="mt-16 border-t border-white/[0.06] pt-12">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow mb-2">Filmography</p>
                <h2 className="text-2xl font-black tracking-tight text-white">Known For</h2>
              </div>
            </div>
            <div className="-mx-5 flex gap-4 overflow-x-auto px-5 pb-6 [scrollbar-width:thin] [scrollbar-color:rgba(124,58,237,0.3)_transparent]">
              {knownFor.map((credit) => (
                <Link
                  to={credit.media_type === "movie" ? `/cinema/${credit.id}` : `/tv/${credit.id}`}
                  className="poster-card w-[148px] shrink-0"
                  key={`${credit.media_type}-${credit.id}`}
                >
                  <div className="relative aspect-[2/3]">
                    <img alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" src={posterUrl(credit.poster_path)} />
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-bold text-white group-hover:text-violet-400 transition-colors">{getTitle(credit)}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${credit.media_type === "movie" ? "text-rose-400 bg-rose-500/10" : "text-violet-400 bg-violet-500/10"}`}>{credit.media_type === "movie" ? "Movie" : "TV"}</span>
                      <span className="text-[10px] text-zinc-600">{getYear(credit)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

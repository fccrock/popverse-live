// src/pages/AlbumDetailPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { api } from "../utils/api";
import { useCollections } from "../context/CollectionsContext";
import { useAuth } from "../context/AuthContext";
import CollectionModal from "../components/CollectionModal";

function msToMins(ms) {
  if (!ms) return "--:--";
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function getSpotifyAlbumUrl(albumName, artistName) {
  const q = encodeURIComponent(`${albumName} ${artistName}`);
  return `https://open.spotify.com/search/${q}`;
}

function getSpotifyTrackUrl(trackName, artistName) {
  const q = encodeURIComponent(`${trackName} ${artistName}`);
  return `https://open.spotify.com/search/${q}`;
}

export default function AlbumDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { addToCollection, getCollectionsForMedia, createCollection } = useCollections();
  const [saveTarget, setSaveTarget] = useState(null);

  const [album, setAlbum] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.getAlbumDetails(id)
      .then((data) => {
        const results = data.results || [];
        const albumInfo = results.find((r) => r.wrapperType === "collection") || results[0];
        const trackList = results.filter((r) => r.wrapperType === "track");
        setAlbum(albumInfo);
        setTracks(trackList);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const handleAddToCollection = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location } });
      return;
    }
    setSaveTarget(mediaItem);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-amber-400" />
          <p className="text-sm text-zinc-500 animate-pulse">Loading album...</p>
        </div>
      </main>
    );
  }

  if (error || !album) {
    return (
      <main className="min-h-screen bg-[#050505] px-5 py-8 text-white">
        <div className="mx-auto max-w-xl rounded-2xl border border-white/[0.07] bg-white/[0.03] p-10 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-400 mb-3">Music</p>
          <h1 className="text-3xl font-black">Album unavailable</h1>
          <p className="mt-3 text-zinc-500 text-sm">{error ?? "Could not load this album."}</p>
          <Link className="mt-7 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-black shadow-lg transition hover:-translate-y-0.5 hover:bg-amber-400" to="/music">
            ← Back to Music
          </Link>
        </div>
      </main>
    );
  }

  const artLarge = album.artworkUrl100?.replace("100x100bb", "600x600bb");
  const artMedium = album.artworkUrl100?.replace("100x100bb", "300x300bb");
  const albumName = album.collectionName || "Unknown Album";
  const artistName = album.artistName || "Unknown Artist";
  const year = album.releaseDate ? album.releaseDate.slice(0, 4) : "";
  const genre = album.primaryGenreName || "";
  const trackCount = album.trackCount || tracks.length;
  const totalMs = tracks.reduce((sum, t) => sum + (t.trackTimeMillis || 0), 0);
  const totalMins = totalMs ? `${Math.round(totalMs / 60000)} min` : "";

  // Build media item for collections
  const mediaItem = {
    mediaId: `album-${id}`,
    mediaType: "album",
    title: albumName,
    posterPath: artMedium || "",
    year,
  };

  const inCollections = getCollectionsForMedia(mediaItem.mediaId);
  const isSaved = inCollections.length > 0;

  return (
    <main className="min-h-screen text-white pb-8 relative z-0">
      {/* Ambient background — blurred album art using img tag (avoids CORS) */}
      <div className="fixed inset-0 -z-10 bg-[#060504] overflow-hidden">
        {artLarge && (
          <img
            src={artLarge}
            alt=""
            aria-hidden="true"
            className="absolute top-0 left-0 w-full h-full object-cover object-center"
            style={{ filter: "blur(100px) brightness(0.15) saturate(1.4)", transform: "scale(1.2)" }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-[#060504]/80 to-[#060504]" />
      </div>

      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-16 xl:px-20 pt-28 pb-8">

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:gap-10 mb-14">
          {/* Square album art */}
          <div className="w-48 shrink-0 overflow-hidden rounded-2xl shadow-2xl shadow-black ring-2 ring-white/10 sm:w-64 lg:w-72">
            {artLarge
              ? <img src={artLarge} alt={albumName} className="aspect-square w-full object-cover" />
              : <div className="aspect-square w-full flex items-center justify-center bg-zinc-800 text-zinc-600">No Art</div>
            }
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-amber-400">Album · {genre}</p>
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight"
              style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}
            >
              {albumName}
            </h1>
            <p className="mt-3 text-xl font-semibold text-zinc-300">{artistName}</p>

            {/* Meta row */}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500 font-medium">
              {year && <span>{year}</span>}
              {trackCount > 0 && <span>·</span>}
              {trackCount > 0 && <span>{trackCount} tracks</span>}
              {totalMins && <span>·</span>}
              {totalMins && <span>{totalMins}</span>}
            </div>

            {/* CTA Buttons */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              {/* Listen on Spotify — single button for the whole album */}
              <a
                href={getSpotifyAlbumUrl(albumName, artistName)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-[#1DB954] px-5 py-2.5 text-sm font-bold text-black shadow-lg shadow-green-900/30 transition hover:bg-[#1ed760] hover:-translate-y-0.5"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                Listen on Spotify
              </a>

              {/* Add to Collection */}
              <button
                onClick={handleAddToCollection}
                className={`flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-bold transition hover:-translate-y-0.5 ${
                  isSaved
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                    : "border-white/[0.08] bg-white/[0.04] text-zinc-300 hover:border-amber-500/40 hover:text-amber-300"
                }`}
              >
                <svg className="h-4 w-4" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                {isSaved ? "Saved" : "Add to Collection"}
              </button>
            </div>
          </div>
        </div>

        {/* ── TRACKLIST ─────────────────────────────────────────────────────── */}
        {tracks.length > 0 && (
          <section className="mb-14">
            <h2 className="mb-5 text-xl font-black tracking-tight text-white">Tracklist</h2>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden divide-y divide-white/[0.04]">
              {tracks.map((track, i) => (
                <div
                  key={track.trackId || i}
                  className="group flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.04] transition-colors"
                >
                  {/* Track number */}
                  <span className="w-7 shrink-0 text-center text-sm font-mono text-zinc-600">
                    {track.trackNumber || i + 1}
                  </span>

                  {/* Track name + artist */}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
                      {track.trackName}
                    </p>
                    <p className="truncate text-xs text-zinc-500">{artistName}</p>
                  </div>

                  {/* Duration */}
                  <span className="shrink-0 text-xs font-mono text-zinc-600">
                    {msToMins(track.trackTimeMillis)}
                  </span>

                  {/* Spotify link — only for individual tracks */}
                  <a
                    href={getSpotifyTrackUrl(track.trackName, artistName)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Listen on Spotify"
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="h-4 w-4 text-[#1DB954]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                  </a>

                  {/* Save Track Button */}
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        navigate("/login", { state: { from: location } });
                        return;
                      }
                      setSaveTarget({
                        mediaId: `album-${id}-track-${track.trackId}`, // unique ID for track to route back to album if needed
                        mediaType: "track",
                        title: track.trackName,
                        posterPath: artMedium || "",
                        year,
                      });
                    }}
                    title="Save Track to Collection"
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-white"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16M4 12h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Album Meta details ─────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h2 className="mb-5 text-lg font-black tracking-tight text-white">Album Details</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
            {[
              { label: "Artist", value: artistName },
              { label: "Released", value: year },
              { label: "Genre", value: genre },
              { label: "Tracks", value: trackCount },
            ].map(({ label, value }) => value ? (
              <div key={label}>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">{label}</p>
                <p className="mt-1.5 text-sm font-bold text-white">{value}</p>
              </div>
            ) : null)}
          </div>
        </section>

      </div>

      {/* Collection Modal — same as movies */}
      <CollectionModal
        isOpen={!!saveTarget}
        mediaItem={saveTarget}
        onClose={() => setSaveTarget(null)}
      />
    </main>
  );
}

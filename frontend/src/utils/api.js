// src/utils/api.js
// All requests go to our Express backend — the TMDB token never touches the browser.

import { API_BASE as BASE } from "../config.js";

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

// iTunes Search API — called directly from browser (CORS supported, no API key needed)
// AWS backend IPs are often blocked by Apple, so we skip the backend for music search.
async function itunesSearch(q, entity = "album", country = "us", limit = 15) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=${entity}&limit=${limit}&country=${country}`;
  const res = await fetch(url);
  if (!res.ok) return { results: [] };
  return res.json();
}

export const api = {
  getTrendingMovies: () => apiFetch("/api/trending/movies"),
  getTopRatedMovies: () => apiFetch("/api/movies/top-rated"),
  getTrendingTv: () => apiFetch("/api/trending/tv"),
  getTopRatedTv: () => apiFetch("/api/tv/top-rated"),
  getTrendingAnime: () => apiFetch("/api/trending/anime"),
  getTopRatedAnime: () => apiFetch("/api/anime/top-rated"),
  getDiscoverMoviesIndian: () => apiFetch("/api/discover/movies/indian"),
  getDiscoverTvIndian: () => apiFetch("/api/discover/tv/indian"),
  getMovieDetails: (id) => apiFetch(`/api/movies/${id}`),
  getTvDetails: (id) => apiFetch(`/api/tv/${id}`),
  getPersonDetails: (id) => apiFetch(`/api/person/${id}`),
  search: (q) => apiFetch(`/api/search?q=${encodeURIComponent(q)}`),
  getMusicCharts: (country = "us") => apiFetch(`/api/music/charts?country=${country}`),
  getMusicNewReleases: (country = "us") => apiFetch(`/api/music/new-releases?country=${country}`),
  getAlbumDetails: (id) => apiFetch(`/api/music/album/${id}`),

  // Direct iTunes browser call — bypasses backend (AWS IPs blocked by Apple)
  searchMusic: async (q, type = "album") => {
    const entity = type === "track" ? "song" : type;
    const [usData, inData] = await Promise.all([
      itunesSearch(q, entity, "us", 15).catch(() => ({ results: [] })),
      itunesSearch(q, entity, "in", 15).catch(() => ({ results: [] })),
    ]);
    const all = [...(inData.results ?? []), ...(usData.results ?? [])];
    const seen = new Set();
    const merged = [];
    for (const item of all) {
      const key = item.trackId ?? item.collectionId;
      if (key && !seen.has(key)) { seen.add(key); merged.push(item); }
    }
    return { results: merged.slice(0, 20) };
  },
};


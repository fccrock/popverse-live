// src/utils/api.js
// All requests go to our Express backend — the TMDB token never touches the browser.

const BASE = import.meta.env.VITE_API_BASE_URL ?? "";

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
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
  searchMusic: (q, type = "album") => apiFetch(`/api/music/search?q=${encodeURIComponent(q)}&type=${type}`),
};

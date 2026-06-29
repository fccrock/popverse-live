// src/utils/tmdb.js
// Pure helper functions — no API calls, no tokens.

export const imageBase = "https://image.tmdb.org/t/p";

export const animeGenreIds = new Set([16]);

export function posterUrl(path, size = "w500") {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${imageBase}/${size}${path}`;
}

export function backdropUrl(path) {
  return path ? `${imageBase}/original${path}` : null;
}

export function getTitle(item) {
  return item?.title ?? item?.name ?? "Untitled";
}

export function getYear(item) {
  const date = item?.release_date ?? item?.first_air_date;
  return date ? date.slice(0, 4) : "TBA";
}

export function getRating(item) {
  if (!item) return "NR";
  if (item.media_type === "person") return "Person";
  return item.vote_average ? item.vote_average.toFixed(1) : "NR";
}

export function getMediaLabel(item) {
  if (!item) return "";
  if (isAnime(item)) return "Anime";
  if (item.media_type === "movie") return "Movie";
  if (item.media_type === "tv") return "TV Show";
  return item.known_for_department ?? "Person";
}

export function isAnime(item) {
  return item?.media_type === "tv" && item?.genre_ids?.some((id) => animeGenreIds.has(id));
}

export function getResultHref(item) {
  if (!item) return "/";
  if (item.media_type === "user") return `/profile/${item.id}`;
  if (item.media_type === "movie") return `/cinema/${item.id}`;
  if (item.media_type === "tv") return `/tv/${item.id}`;
  return `/person/${item.id}`;
}

export function minutesToRuntime(minutes) {
  if (!minutes) return "Runtime TBA";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export const tmdbGenres = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
  10759: "Action & Adventure",
  10762: "Kids",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
};

export const tmdbLanguages = {
  en: "English",
  ja: "Japanese",
  ko: "Korean",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  zh: "Chinese",
  ru: "Russian",
  hi: "Hindi",
};

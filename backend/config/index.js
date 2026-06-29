// config/index.js
// Loads .env from the backend root directory
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const TMDB_TOKEN = process.env.TMDB_TOKEN;

if (!TMDB_TOKEN) {
  console.warn(
    "[config] WARNING: TMDB_TOKEN is not set in .env — movie/TV routes will return empty data."
  );
}

function tmdbHeaders() {
  const token = TMDB_TOKEN?.startsWith("Bearer ")
    ? TMDB_TOKEN
    : `Bearer ${TMDB_TOKEN}`;
  return {
    Authorization: token,
    Accept: "application/json",
  };
}

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  TMDB_BASE: "https://api.themoviedb.org/3",
  tmdbHeaders,
};

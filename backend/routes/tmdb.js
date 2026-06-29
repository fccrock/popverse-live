// routes/tmdb.js
const express = require("express");
const router = express.Router();
const {
  getTrendingMovies,
  getTopRatedMovies,
  getTrendingTv,
  getTopRatedTv,
  getTrendingAnime,
  getTopRatedAnime,
  getDiscoverMoviesIndian,
  getDiscoverTvIndian,
  getMovieDetails,
  getTvDetails,
  getPersonDetails,
  searchMulti,
} = require("../controllers/tmdb");

router.get("/trending/movies", getTrendingMovies);
router.get("/movies/top-rated", getTopRatedMovies);
router.get("/trending/tv", getTrendingTv);
router.get("/tv/top-rated", getTopRatedTv);
router.get("/trending/anime", getTrendingAnime);
router.get("/anime/top-rated", getTopRatedAnime);
router.get("/discover/movies/indian", getDiscoverMoviesIndian);
router.get("/discover/tv/indian", getDiscoverTvIndian);
router.get("/movies/:id", getMovieDetails);
router.get("/tv/:id", getTvDetails);
router.get("/person/:id", getPersonDetails);
router.get("/search", searchMulti);

module.exports = router;

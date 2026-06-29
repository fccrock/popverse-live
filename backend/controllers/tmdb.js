// controllers/tmdb.js
// All TMDb API calls are made here on the server — the token never reaches the browser.

const { TMDB_BASE, tmdbHeaders } = require("../config");

async function tmdbFetch(path) {
  const res = await fetch(`${TMDB_BASE}${path}`, { headers: tmdbHeaders() });
  if (!res.ok) {
    const err = new Error(`TMDb ${res.status}: ${res.statusText}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

// GET /api/trending/movies
async function getTrendingMovies(req, res) {
  try {
    const data = await tmdbFetch("/trending/movie/week");
    res.json(data);
  } catch (err) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
}

// GET /api/movies/top-rated
async function getTopRatedMovies(req, res) {
  try {
    const data = await tmdbFetch("/movie/top_rated?language=en-US&page=1");
    res.json(data);
  } catch (err) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
}

// GET /api/tv/top-rated
async function getTopRatedTv(req, res) {
  try {
    const data = await tmdbFetch("/tv/top_rated?language=en-US&page=1");
    res.json(data);
  } catch (err) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
}

// GET /api/anime/top-rated
async function getTopRatedAnime(req, res) {
  try {
    // Anime = animation genre (16) on TV, sorted by vote_average
    const data = await tmdbFetch("/discover/tv?with_genres=16&sort_by=vote_average.desc&vote_count.gte=200&page=1");
    res.json(data);
  } catch (err) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
}

// GET /api/trending/tv
async function getTrendingTv(req, res) {
  try {
    const data = await tmdbFetch("/trending/tv/week");
    res.json(data);
  } catch (err) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
}

// GET /api/trending/anime
async function getTrendingAnime(req, res) {
  try {
    const data = await tmdbFetch("/discover/tv?with_genres=16&with_origin_country=JP&sort_by=popularity.desc");
    res.json(data);
  } catch (err) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
}

// GET /api/discover/movies/indian
// Fetches popular Indian films across Bollywood, Tollywood, Mollywood, Kollywood
async function getDiscoverMoviesIndian(req, res) {
  try {
    const data = await tmdbFetch(
      "/discover/movie?with_original_language=hi%7Cta%7Cte%7Cml%7Ckn&sort_by=popularity.desc&include_adult=false"
    );
    res.json(data);
  } catch (err) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
}

// GET /api/discover/tv/indian
// Fetches popular Indian TV shows across Hindi, Tamil, Telugu, Malayalam, Kannada
async function getDiscoverTvIndian(req, res) {
  try {
    const data = await tmdbFetch(
      "/discover/tv?with_original_language=hi%7Cta%7Cte%7Cml%7Ckn&sort_by=popularity.desc&include_adult=false"
    );
    res.json(data);
  } catch (err) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
}

// GET /api/movies/:id
async function getMovieDetails(req, res) {
  try {
    const { id } = req.params;
    const data = await tmdbFetch(
      `/movie/${id}?append_to_response=videos,credits,watch/providers`
    );
    res.json(data);
  } catch (err) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
}

// GET /api/tv/:id
async function getTvDetails(req, res) {
  try {
    const { id } = req.params;
    const data = await tmdbFetch(
      `/tv/${id}?append_to_response=videos,credits,watch/providers`
    );
    res.json(data);
  } catch (err) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
}

// GET /api/person/:id
async function getPersonDetails(req, res) {
  try {
    const { id } = req.params;
    const data = await tmdbFetch(
      `/person/${id}?append_to_response=combined_credits,images`
    );
    res.json(data);
  } catch (err) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
}

// GET /api/search?q=...
async function searchMulti(req, res) {
  try {
    const q = (req.query.q ?? "").trim();
    if (q.length < 2) {
      return res.json({ results: [] });
    }
    const data = await tmdbFetch(
      `/search/multi?query=${encodeURIComponent(q)}&include_adult=false&language=en-US&page=1`
    );
    res.json(data);
  } catch (err) {
    res.status(err.status ?? 500).json({ error: err.message });
  }
}

module.exports = {
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
};

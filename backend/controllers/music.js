// backend/controllers/music.js
// Uses the iTunes Search API — completely free, no API key required.

const ITUNES_BASE = "https://itunes.apple.com";

async function itunesFetch(path) {
  const res = await fetch(`${ITUNES_BASE}${path}`);
  if (!res.ok) throw new Error(`iTunes API error: ${res.status}`);
  return res.json();
}

// GET /api/music/charts
// Returns top 20 songs from iTunes charts
async function getMusicCharts(req, res) {
  try {
    const country = req.query.country || "us";
    const data = await itunesFetch(
      `/rss/topsongs/limit=20/country=${country}/json`
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/music/new-releases
// Returns top 20 albums (newest releases = top albums RSS)
async function getNewReleases(req, res) {
  try {
    const country = req.query.country || "us";
    const data = await itunesFetch(
      `/rss/topalbums/limit=20/country=${country}/json`
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/music/album/:id
// Returns full album lookup from iTunes
async function getAlbumDetails(req, res) {
  try {
    const { id } = req.params;
    const data = await itunesFetch(
      `/lookup?id=${id}&entity=song&limit=50`
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/music/search?q=...
// Search albums/songs
async function searchMusic(req, res) {
  try {
    const q = encodeURIComponent(req.query.q || "");
    const type = req.query.type || "album"; // album or song
    const data = await itunesFetch(
      `/search?term=${q}&media=music&entity=${type}&limit=20`
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getMusicCharts, getNewReleases, getAlbumDetails, searchMusic };

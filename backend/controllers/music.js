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
// Search albums/songs across US + India stores for better coverage
async function searchMusic(req, res) {
  try {
    const q = encodeURIComponent(req.query.q || "");
    const typeParam = req.query.type || "album";
    // iTunes uses 'song' not 'track' — map accordingly
    const entity = typeParam === "track" ? "song" : typeParam;

    // Search US, India, and UK stores in parallel for broadest coverage
    const [usData, inData, gbData] = await Promise.all([
      itunesFetch(`/search?term=${q}&media=music&entity=${entity}&limit=15&country=us`).catch(() => ({ results: [] })),
      itunesFetch(`/search?term=${q}&media=music&entity=${entity}&limit=15&country=in`).catch(() => ({ results: [] })),
      itunesFetch(`/search?term=${q}&media=music&entity=${entity}&limit=10&country=gb`).catch(() => ({ results: [] })),
    ]);

    const allResults = [...(inData.results ?? []), ...(usData.results ?? []), ...(gbData.results ?? [])];

    // Deduplicate by trackId / collectionId
    const seen = new Set();
    const merged = [];
    for (const item of allResults) {
      const key = item.trackId ?? item.collectionId;
      if (key && !seen.has(key)) { seen.add(key); merged.push(item); }
    }

    res.json({ resultCount: merged.length, results: merged.slice(0, 20) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getMusicCharts, getNewReleases, getAlbumDetails, searchMusic };

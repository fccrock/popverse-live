# PopCultureHub

One place for everything you love — movies, TV, music, games, books.

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Frontend | React 18 + Vite + Tailwind CSS          |
| Backend  | Node.js + Express                       |
| Routing  | React Router v6                         |
| API      | TMDb (proxied through backend)          |

## Why the backend proxy matters

The original project called TMDb directly from the browser using `NEXT_PUBLIC_TMDB_TOKEN`. Any visitor could open DevTools and steal that token.

**Now:** the TMDB token lives only in the root `.env` file (server-side). The frontend calls `/api/*` on our Express server, which forwards to TMDb and returns the data. The token never reaches the browser.

```
Browser → GET /api/trending/movies → Express → TMDb API (with token)
```

## Project Structure

```
popculturehub/
├── .env                    ← ALL secrets (never commit)
├── .env.example            ← Safe template (commit this)
├── .gitignore
│
├── backend/
│   ├── server.js           ← Express app entry
│   ├── config/index.js     ← Loads .env, exports helpers
│   ├── routes/tmdb.js      ← Route definitions
│   └── controllers/tmdb.js ← All TMDb API calls (server-only)
│
└── frontend/
    ├── vite.config.js      ← Dev proxy: /api → localhost:5000
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx          ← React Router setup
    │   ├── utils/
    │   │   ├── api.js       ← Fetch wrapper (calls backend, no token)
    │   │   └── tmdb.js      ← Pure helper functions (no API calls)
    │   ├── hooks/
    │   │   └── useFetch.js  ← Generic data-fetching hook
    │   ├── components/
    │   │   ├── GlobalSearch.jsx
    │   │   ├── Navbar.jsx
    │   │   └── TrailerModal.jsx
    │   └── pages/
    │       ├── HomePage.jsx
    │       ├── CinemaPage.jsx
    │       ├── MovieDetailPage.jsx
    │       ├── TvDetailPage.jsx
    │       ├── PersonPage.jsx
    │       └── SearchPage.jsx
```

## Setup

### 1. Configure environment variables

```bash
cp .env.example .env   # if .env.example exists
# or just edit the existing .env
```

Edit `.env` at the project root and fill in your values:

```env
TMDB_TOKEN=your_tmdb_read_access_token
PORT=5000
```

> Get your TMDb Read Access Token at https://www.themoviedb.org/settings/api

### 2. Install and run the backend

```bash
cd backend
npm install
npm run dev
# → API running on http://localhost:5000
```

### 3. Install and run the frontend

```bash
cd frontend
npm install
npm run dev
# → App running on http://localhost:3000
```

Vite proxies `/api/*` to `http://localhost:5000` automatically in dev.

## API Routes

| Method | Route                    | Description               |
|--------|--------------------------|---------------------------|
| GET    | `/`                      | Health check              |
| GET    | `/api/trending/movies`   | Trending movies this week |
| GET    | `/api/movies/:id`        | Movie details + cast      |
| GET    | `/api/tv/:id`            | TV show details + cast    |
| GET    | `/api/person/:id`        | Person details + credits  |
| GET    | `/api/search?q=...`      | Multi-search              |

## Planned Features

- [ ] Spotify API integration (music section)
- [ ] User accounts + collections
- [ ] Community clubs
- [ ] AWS RDS (PostgreSQL) for persistent data
- [ ] AWS S3 for image storage
- [ ] AWS EC2 deployment

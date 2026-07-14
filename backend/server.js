// server.js - deployed: 2026-07-14 (database-2 migration)
const express = require("express");
const cors = require("cors");
const { PORT, NODE_ENV } = require("./config");
const tmdbRoutes = require("./routes/tmdb");
const musicRoutes = require("./routes/music");
const clubsRoutes = require("./routes/clubs");
const collectionsRoutes = require("./routes/collections");
const usersRoutes = require("./routes/users");
const reviewsRoutes = require("./routes/reviews");
const uploadRoutes = require("./routes/upload");
const notificationsRoutes = require("./routes/notifications");

const app = express();

// ── Middleware ──────────────────────────────────────────────────────────────────
app.use(cors({
  origin: "*"
}));
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({ message: "PopCultureHub API is running" });
});

app.use("/api", tmdbRoutes);
app.use("/api/music", musicRoutes);
app.use("/api/clubs", clubsRoutes);
app.use("/api/collections", collectionsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/notifications", notificationsRoutes);

// ── 404 handler ─────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Global error handler ─────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`[server] PopCultureHub API running on http://localhost:${PORT}`);
  console.log(`[server] Environment: ${NODE_ENV}`);
});

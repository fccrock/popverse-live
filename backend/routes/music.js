// backend/routes/music.js
const express = require("express");
const router = express.Router();
const { getMusicCharts, getNewReleases, getAlbumDetails, searchMusic } = require("../controllers/music");

router.get("/charts", getMusicCharts);
router.get("/new-releases", getNewReleases);
router.get("/album/:id", getAlbumDetails);
router.get("/search", searchMusic);

module.exports = router;

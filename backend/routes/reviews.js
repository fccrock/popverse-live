const express = require("express");
const router = express.Router();
const reviewsController = require("../controllers/reviews.controller");

// Get all reviews for a user
router.get("/user/:username", reviewsController.getUserReviews);

// Get reviews for a specific piece of media
router.get("/media/:mediaType/:mediaId", reviewsController.getMediaReviews);

// Create or update a review
router.post("/", reviewsController.upsertReview);

// Delete a review
router.delete("/:reviewId", reviewsController.deleteReview);

module.exports = router;

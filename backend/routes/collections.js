const express = require("express");
const router = express.Router();
const collectionsController = require("../controllers/collections.controller");

// Get all PUBLIC collections (Community page) - must come BEFORE /:collectionId
router.get("/public", collectionsController.getPublicCollections);

// Get all collections for a user
router.get("/user/:username", collectionsController.getUserCollections);

// Create a new collection
router.post("/", collectionsController.createCollection);

// Get a single collection by ID (public or own)
router.get("/:collectionId", collectionsController.getCollectionById);

// Update a collection (privacy, name, cover, tags)
router.patch("/:collectionId", collectionsController.updateCollection);

// Delete a collection
router.delete("/:collectionId", collectionsController.deleteCollection);

// Add an item to a collection
router.post("/:collectionId/items", collectionsController.saveItem);

// Toggle a like on a collection
router.post("/:collectionId/like", collectionsController.toggleCollectionLike);


// Remove an item from a collection
router.delete("/:collectionId/items/:mediaId", collectionsController.removeItem);

// Toggle watched on an item
router.patch("/:collectionId/items/:mediaId/watched", collectionsController.toggleItemWatched);

module.exports = router;

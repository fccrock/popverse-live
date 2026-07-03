const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Get all collections for a user
async function getUserCollections(req, res) {
  try {
    const { username } = req.params;
    
    const user = await prisma.user.findFirst({ 
      where: { username: { equals: username, mode: "insensitive" } }
    });
    if (!user) return res.json([]);

    const collections = await prisma.collection.findMany({
      where: { userId: user.id },
      include: { items: true, likes: { include: { user: true } } },
      orderBy: { createdAt: "asc" },
    });

    res.json(collections);
  } catch (error) {
    console.error("Error fetching collections:", error);
    res.status(500).json({ error: "Failed to fetch collections" });
  }
}

// Get all PUBLIC collections (for Community page and Discover)
async function getPublicCollections(req, res) {
  try {
    const collections = await prisma.collection.findMany({
      where: { isPublic: true },
      include: { 
        items: true,
        user: true,
        likes: { include: { user: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Map to include createdBy as username string for frontend
    const mapped = collections.map(c => ({
      ...c,
      createdBy: c.user?.username || null,
    }));

    res.json(mapped);
  } catch (error) {
    console.error("Error fetching public collections:", error);
    res.status(500).json({ error: "Failed to fetch public collections" });
  }
}

// Create a new collection
async function createCollection(req, res) {
  try {
    const { username, title, description, coverImage, tags, isPublic } = req.body;

    let user = await prisma.user.findFirst({ 
      where: { username: { equals: username, mode: "insensitive" } }
    });
    if (!user) {
      user = await prisma.user.create({ data: { cognitoId: username, username } });
    }

    const collection = await prisma.collection.create({
      data: {
        title,
        description: description || "",
        coverImage: coverImage || null,
        tags: tags || [],
        isPublic: isPublic === true,
        userId: user.id,
      },
      include: { items: true },
    });

    res.json(collection);
  } catch (error) {
    console.error("Error creating collection:", error);
    res.status(500).json({ error: "Failed to create collection" });
  }
}

// Update a collection (name, description, isPublic, coverImage)
async function updateCollection(req, res) {
  try {
    const { collectionId } = req.params;
    const { title, description, isPublic, coverImage, tags } = req.body;

    const data = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (isPublic !== undefined) data.isPublic = isPublic;
    if (coverImage !== undefined) data.coverImage = coverImage;
    if (tags !== undefined) data.tags = tags;

    const collection = await prisma.collection.update({
      where: { id: collectionId },
      data,
      include: { items: true },
    });

    res.json(collection);
  } catch (error) {
    console.error("Error updating collection:", error);
    res.status(500).json({ error: "Failed to update collection" });
  }
}

// Save an item to a collection
async function saveItem(req, res) {
  try {
    const { collectionId } = req.params;
    const { mediaId, mediaType, title, posterPath, year, watched } = req.body;

    // Upsert: if same mediaId already in collection, do nothing (avoid duplicate)
    const existing = await prisma.collectionItem.findFirst({
      where: { collectionId, mediaId: String(mediaId) }
    });
    if (existing) {
      return res.json(existing);
    }

    const item = await prisma.collectionItem.create({
      data: {
        collectionId,
        mediaId: String(mediaId),
        mediaType,
        title,
        posterPath,
        year: year ? String(year) : null,
        watched: watched === true,
      },
    });

    res.json(item);
  } catch (error) {
    console.error("Error saving item:", error);
    res.status(500).json({ error: "Failed to save item" });
  }
}

// Delete a collection
async function deleteCollection(req, res) {
  try {
    const { collectionId } = req.params;
    await prisma.collection.delete({
      where: { id: collectionId }
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting collection:", error);
    res.status(500).json({ error: "Failed to delete collection" });
  }
}

// Remove an item from a collection
async function removeItem(req, res) {
  try {
    const { collectionId, mediaId } = req.params;
    
    await prisma.collectionItem.deleteMany({
      where: {
        collectionId: collectionId,
        mediaId: String(mediaId)
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error removing item:", error);
    res.status(500).json({ error: "Failed to remove item" });
  }
}

// Toggle watched status on a single item
async function toggleItemWatched(req, res) {
  try {
    const { collectionId, mediaId } = req.params;
    const { watched } = req.body;

    const item = await prisma.collectionItem.findFirst({
      where: { collectionId, mediaId: String(mediaId) }
    });

    if (!item) return res.status(404).json({ error: "Item not found" });

    const updated = await prisma.collectionItem.update({
      where: { id: item.id },
      data: { watched: watched !== undefined ? watched : !item.watched }
    });

    res.json(updated);
  } catch (error) {
    console.error("Error toggling watched:", error);
    res.status(500).json({ error: "Failed to toggle watched" });
  }
}

// Get a single collection by ID
async function getCollectionById(req, res) {
  try {
    const { collectionId } = req.params;
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      include: { items: true, user: true, likes: { include: { user: true } } },
    });
    if (!collection) return res.status(404).json({ error: "Collection not found" });
    res.json({ ...collection, createdBy: collection.user?.username || null });
  } catch (error) {
    console.error("Error fetching collection:", error);
    res.status(500).json({ error: "Failed to fetch collection" });
  }
}

// Toggle collection like
async function toggleCollectionLike(req, res) {
  try {
    const { collectionId } = req.params;
    const { username } = req.body;

    let user = await prisma.user.findFirst({
      where: { username: { equals: username, mode: "insensitive" } }
    });
    
    if (!user) {
      user = await prisma.user.create({
        data: { cognitoId: username, username }
      });
    }

    const existing = await prisma.collectionLike.findUnique({
      where: { collectionId_userId: { collectionId, userId: user.id } }
    });

    if (existing) {
      await prisma.collectionLike.delete({ where: { id: existing.id } });
      res.json({ liked: false });
    } else {
      await prisma.collectionLike.create({
        data: { collectionId, userId: user.id }
      });

      // Create notification
      const collection = await prisma.collection.findUnique({ where: { id: collectionId } });
      if (collection && collection.userId !== user.id) {
        await prisma.notification.create({
          data: {
            userId: collection.userId,
            actorId: user.id,
            type: "COLLECTION_LIKE",
            message: `liked your collection "${collection.title}".`,
            link: `/collection/${collectionId}`
          }
        });
      }

      res.json({ liked: true });
    }
  } catch (error) {
    console.error("Error toggling collection like:", error);
    res.status(500).json({ error: "Failed to toggle collection like" });
  }
}

module.exports = {
  getUserCollections,
  getPublicCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  saveItem,
  deleteCollection,
  removeItem,
  toggleItemWatched,
  toggleCollectionLike,
};

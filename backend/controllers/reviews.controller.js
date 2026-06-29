const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Get all reviews for a specific user (by username)
async function getUserReviews(req, res) {
  try {
    const { username } = req.params;

    const user = await prisma.user.findFirst({
      where: { username: { equals: username, mode: "insensitive" } },
    });
    if (!user) return res.json([]);

    const reviews = await prisma.review.findMany({
      where: { authorId: user.id },
      include: { author: true },
      orderBy: { createdAt: "desc" },
    });

    res.json(reviews);
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
}

// Get reviews for a specific piece of media (visible to all users)
async function getMediaReviews(req, res) {
  try {
    const { mediaType, mediaId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { mediaId, mediaType },
      include: { author: true },
      orderBy: { createdAt: "desc" },
    });

    res.json(reviews);
  } catch (error) {
    console.error("Error fetching media reviews:", error);
    res.status(500).json({ error: "Failed to fetch media reviews" });
  }
}

// Create or update a review
async function upsertReview(req, res) {
  try {
    const { username, mediaId, mediaType, rating, text, isSpoiler } = req.body;

    let user = await prisma.user.findFirst({
      where: { username: { equals: username, mode: "insensitive" } },
    });
    if (!user) {
      user = await prisma.user.create({
        data: { cognitoId: username, username },
      });
    }

    const review = await prisma.review.upsert({
      where: {
        authorId_mediaId_mediaType: {
          authorId: user.id,
          mediaId: String(mediaId),
          mediaType,
        },
      },
      update: { rating, text, isSpoiler: isSpoiler ?? false },
      create: {
        authorId: user.id,
        mediaId: String(mediaId),
        mediaType,
        rating,
        text,
        isSpoiler: isSpoiler ?? false,
      },
      include: { author: true },
    });

    res.json(review);
  } catch (error) {
    console.error("Error upserting review:", error);
    res.status(500).json({ error: "Failed to save review" });
  }
}

// Delete a review
async function deleteReview(req, res) {
  try {
    const { reviewId } = req.params;
    await prisma.review.delete({ where: { id: reviewId } });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ error: "Failed to delete review" });
  }
}

module.exports = {
  getUserReviews,
  getMediaReviews,
  upsertReview,
  deleteReview,
};

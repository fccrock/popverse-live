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
      include: {
        author: true,
        likes: { include: { user: true } },
        replies: { include: { author: true }, orderBy: { createdAt: "asc" } }
      },
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
      include: {
        author: true,
        likes: { include: { user: true } },
        replies: { include: { author: true }, orderBy: { createdAt: "asc" } }
      },
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
      include: {
        author: true,
        likes: { include: { user: true } },
        replies: { include: { author: true }, orderBy: { createdAt: "asc" } }
      },
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

// Toggle a like on a review
async function toggleReviewLike(req, res) {
  try {
    const { reviewId } = req.params;
    const { username } = req.body;

    const user = await prisma.user.findFirst({
      where: { username: { equals: username, mode: "insensitive" } }
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    const existing = await prisma.reviewLike.findUnique({
      where: { reviewId_userId: { reviewId, userId: user.id } }
    });

    if (existing) {
      await prisma.reviewLike.delete({ where: { id: existing.id } });
      res.json({ liked: false });
    } else {
      await prisma.reviewLike.create({
        data: { reviewId, userId: user.id }
      });
      res.json({ liked: true });
    }
  } catch (error) {
    console.error("Error toggling review like:", error);
    res.status(500).json({ error: "Failed to toggle review like" });
  }
}

// Reply to a review
async function createReviewReply(req, res) {
  try {
    const { reviewId } = req.params;
    const { content, createdBy } = req.body;

    const user = await prisma.user.findFirst({
      where: { username: { equals: createdBy, mode: "insensitive" } }
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    const reply = await prisma.reviewReply.create({
      data: { content, reviewId, authorId: user.id },
      include: { author: true }
    });
    res.json(reply);
  } catch (error) {
    console.error("Error creating review reply:", error);
    res.status(500).json({ error: "Failed to create review reply" });
  }
}

// Delete a review reply
async function deleteReviewReply(req, res) {
  try {
    const { replyId } = req.params;
    await prisma.reviewReply.delete({ where: { id: replyId } });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting review reply:", error);
    res.status(500).json({ error: "Failed to delete review reply" });
  }
}

module.exports = {
  getUserReviews,
  getMediaReviews,
  upsertReview,
  deleteReview,
  toggleReviewLike,
  createReviewReply,
  deleteReviewReply,
};

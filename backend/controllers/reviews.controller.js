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
        replies: {
          where: { parentId: null },
          include: {
            author: true,
            replies: {
              include: { author: true },
              orderBy: { createdAt: "asc" }
            }
          },
          orderBy: { createdAt: "asc" }
        }
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
        replies: {
          where: { parentId: null },
          include: {
            author: true,
            replies: {
              include: { author: true },
              orderBy: { createdAt: "asc" }
            }
          },
          orderBy: { createdAt: "asc" }
        }
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

    if (!username || !mediaId || !mediaType || rating === undefined || !text) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let user = await prisma.user.findFirst({
      where: { username: { equals: username, mode: "insensitive" } },
    });
    if (!user) {
      user = await prisma.user.create({
        data: { cognitoId: username, username },
      });
    }

    const includeClause = {
      author: true,
      likes: { include: { user: true } },
      replies: {
        where: { parentId: null },
        include: {
          author: true,
          replies: {
            include: { author: true },
            orderBy: { createdAt: "asc" }
          }
        },
        orderBy: { createdAt: "asc" }
      }
    };

    // Use findFirst + create/update instead of upsert to avoid compound key issues
    const existing = await prisma.review.findFirst({
      where: {
        authorId: user.id,
        mediaId: String(mediaId),
        mediaType,
      },
    });

    let review;
    if (existing) {
      review = await prisma.review.update({
        where: { id: existing.id },
        data: { rating, text, isSpoiler: isSpoiler ?? false },
        include: includeClause,
      });
    } else {
      review = await prisma.review.create({
        data: {
          authorId: user.id,
          mediaId: String(mediaId),
          mediaType,
          rating,
          text,
          isSpoiler: isSpoiler ?? false,
        },
        include: includeClause,
      });
    }

    res.json(review);
  } catch (error) {
    console.error("Error upserting review:", error);
    res.status(500).json({ error: "Failed to save review", details: error.message });
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

    let user = await prisma.user.findFirst({
      where: { username: { equals: username, mode: "insensitive" } }
    });
    if (!user) {
      user = await prisma.user.create({
        data: { cognitoId: username, username }
      });
    }

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
      
      // Create notification
      const review = await prisma.review.findUnique({ where: { id: reviewId }, select: { authorId: true, mediaId: true, mediaType: true } });
      if (review && review.authorId !== user.id) {
        await prisma.notification.create({
          data: {
            userId: review.authorId,
            actorId: user.id,
            type: "REVIEW_LIKE",
            message: `liked your review.`,
            link: `/${review.mediaType}/${review.mediaId}`
          }
        });
      }

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
    const { content, createdBy, parentId } = req.body;

    let user = await prisma.user.findFirst({
      where: { username: { equals: createdBy, mode: "insensitive" } }
    });
    if (!user) {
      user = await prisma.user.create({
        data: { cognitoId: createdBy, username: createdBy }
      });
    }

    const reply = await prisma.reviewReply.create({
      data: { content, reviewId, authorId: user.id, parentId: parentId || null },
      include: { author: true }
    });

    // Create notification
    const review = await prisma.review.findUnique({ where: { id: reviewId }, select: { authorId: true, mediaId: true, mediaType: true } });
    if (review && review.authorId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: review.authorId,
          actorId: user.id,
          type: "REVIEW_REPLY",
          message: `replied to your review.`,
          link: `/${review.mediaType}/${review.mediaId}`
        }
      });
    }

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

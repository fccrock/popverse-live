const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Get all clubs
async function getClubs(req, res) {
  try {
    const clubs = await prisma.club.findMany({
      include: {
        members: {
          include: {
            user: true,
          },
        },
        ClubPost: {
          include: {
            author: true,
            likes: {
              include: {
                user: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        ClubDiscussion: {
          include: {
            author: true,
            replies: {
              where: { parentId: null },
              include: {
                author: true,
                replies: {
                  include: {
                    author: true
                  },
                  orderBy: { createdAt: 'asc' }
                }
              },
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      },
    });
    res.json(clubs);
  } catch (error) {
    console.error("Error fetching clubs:", error);
    res.status(500).json({ error: "Failed to fetch clubs" });
  }
}

// Join a club
async function joinClub(req, res) {
  try {
    const { clubId } = req.params;
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    // Find or create the user (since they might log in via Cognito but not exist in our DB yet)
    let user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          cognitoId: username, // Fallback, usually we'd pass this from the frontend
          username: username,
        },
      });
    }

    // Check if membership already exists
    const existingMembership = await prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId: user.id,
        },
      },
    });

    if (existingMembership) {
      return res.status(400).json({ error: "You are already a member of this club" });
    }

    const membership = await prisma.clubMember.create({
      data: {
        clubId,
        userId: user.id,
        role: "member",
      },
      include: {
        user: true,
      },
    });

    res.json(membership);
  } catch (error) {
    console.error("Error joining club:", error);
    res.status(500).json({ error: "Failed to join club" });
  }
}

// Leave a club
async function leaveClub(req, res) {
  try {
    const { clubId } = req.params;
    const { username } = req.body; // Using body for now, normally we'd extract from a JWT token

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(404).json({ error: "User not found" });

    await prisma.clubMember.delete({
      where: {
        clubId_userId: {
          clubId,
          userId: user.id,
        },
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error leaving club:", error);
    res.status(500).json({ error: "Failed to leave club" });
  }
}

// Create a new club
async function createClub(req, res) {
  try {
    const { name, slug, description, category, coverImage, createdBy } = req.body;

    // Check if creator exists, create if not
    let user = await prisma.user.findUnique({ where: { username: createdBy } });
    if (!user) {
      user = await prisma.user.create({
        data: { cognitoId: createdBy, username: createdBy }
      });
    }

    const club = await prisma.club.create({
      data: {
        name,
        slug,
        description,
        category: category || "general",
        coverImage: coverImage || "https://image.tmdb.org/t/p/w1280/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
        createdBy: user.username,
        members: {
          create: {
            userId: user.id,
            role: "admin"
          }
        }
      },
      include: {
        members: {
          include: { user: true }
        }
      }
    });

    res.json(club);
  } catch (error) {
    console.error("Error creating club:", error);
    res.status(500).json({ error: "Failed to create club" });
  }
}

// Create a post in a club
async function createPost(req, res) {
  try {
    const { clubId } = req.params;
    const { content, createdBy } = req.body;

    const user = await prisma.user.findUnique({ where: { username: createdBy } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const post = await prisma.clubPost.create({
      data: {
        content,
        authorId: user.id,
        clubId,
      },
      include: { author: true, likes: true }
    });

    res.json(post);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: "Failed to create post" });
  }
}

// Like a post
async function likePost(req, res) {
  try {
    const { clubId, postId } = req.params;
    const { username } = req.body;

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Check if already liked
    const existing = await prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId: user.id } }
    });

    if (existing) {
      // Unlike
      await prisma.postLike.delete({ where: { id: existing.id } });
      return res.json({ liked: false });
    } else {
      // Like
      await prisma.postLike.create({
        data: { postId, userId: user.id }
      });
      return res.json({ liked: true });
    }
  } catch (error) {
    console.error("Error liking post:", error);
    res.status(500).json({ error: "Failed to toggle like" });
  }
}

// Create a discussion thread
async function createDiscussion(req, res) {
  try {
    const { clubId } = req.params;
    const { title, content, createdBy } = req.body;

    const user = await prisma.user.findUnique({ where: { username: createdBy } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const discussion = await prisma.clubDiscussion.create({
      data: {
        title,
        content,
        authorId: user.id,
        clubId,
      },
      include: { author: true, replies: true }
    });

    res.json(discussion);
  } catch (error) {
    console.error("Error creating discussion:", error);
    res.status(500).json({ error: "Failed to create discussion" });
  }
}

// Reply to a discussion
async function createReply(req, res) {
  try {
    const { clubId, discussionId } = req.params;
    const { content, createdBy, parentId } = req.body;

    const user = await prisma.user.findUnique({ where: { username: createdBy } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const reply = await prisma.discussionReply.create({
      data: {
        content,
        authorId: user.id,
        discussionId,
        parentId: parentId || null
      },
      include: { author: true }
    });

    res.json(reply);
  } catch (error) {
    console.error("Error creating reply:", error);
    res.status(500).json({ error: "Failed to create reply" });
  }
}

// Delete a discussion (only by author)
async function deleteDiscussion(req, res) {
  try {
    const { discussionId } = req.params;
    const { username } = req.body;

    const discussion = await prisma.clubDiscussion.findUnique({
      where: { id: discussionId },
      include: { author: true }
    });
    if (!discussion) return res.status(404).json({ error: "Discussion not found" });
    if (discussion.author.username.toLowerCase() !== username.toLowerCase()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await prisma.clubDiscussion.delete({ where: { id: discussionId } });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting discussion:", error);
    res.status(500).json({ error: "Failed to delete discussion" });
  }
}

// Delete a reply (only by author)
async function deleteReply(req, res) {
  try {
    const { replyId } = req.params;
    const { username } = req.body;

    const reply = await prisma.discussionReply.findUnique({
      where: { id: replyId },
      include: { author: true }
    });
    if (!reply) return res.status(404).json({ error: "Reply not found" });
    if (reply.author.username.toLowerCase() !== username.toLowerCase()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await prisma.discussionReply.delete({ where: { id: replyId } });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting reply:", error);
    res.status(500).json({ error: "Failed to delete reply" });
  }
}

// Delete a post (only by author)
async function deletePost(req, res) {
  try {
    const { postId } = req.params;
    const { username } = req.body;

    const post = await prisma.clubPost.findUnique({
      where: { id: postId },
      include: { author: true }
    });
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.author.username.toLowerCase() !== username.toLowerCase()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await prisma.clubPost.delete({ where: { id: postId } });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ error: "Failed to delete post" });
  }
}

module.exports = {
  getClubs,
  joinClub,
  leaveClub,
  createClub,
  createPost,
  deletePost,
  likePost,
  createDiscussion,
  deleteDiscussion,
  createReply,
  deleteReply
};


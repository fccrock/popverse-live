const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Get a user profile
async function getProfile(req, res) {
  try {
    const { username } = req.params;
    
    let user = await prisma.user.findFirst({ 
      where: { username: { equals: username, mode: 'insensitive' } },
      include: {
        followers: { include: { follower: true } },
        following: { include: { following: true } }
      }
    });

    if (!user) {
      // Auto-create if they don't exist yet (from Cognito)
      user = await prisma.user.create({
        data: {
          cognitoId: username,
          username,
        },
        include: {
          followers: { include: { follower: true } },
          following: { include: { following: true } }
        }
      });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
}

// Update a user profile
async function updateProfile(req, res) {
  try {
    const { username } = req.params;
    const { displayName, bio, avatarUrl } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: { username: { equals: username, mode: 'insensitive' } }
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        displayName,
        bio,
        avatar: avatarUrl,
      }
    });

    res.json(user);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
}

// Search for users
async function searchUsers(req, res) {
  try {
    const { query } = req.query;
    if (!query) return res.json([]);

    let cleanQuery = query;
    if (cleanQuery.startsWith('@')) cleanQuery = cleanQuery.slice(1);

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: cleanQuery, mode: 'insensitive' } },
          { displayName: { contains: cleanQuery, mode: 'insensitive' } }
        ]
      },
      take: 20
    });

    res.json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ error: "Failed to search users" });
  }
}

// Follow a user
async function followUser(req, res) {
  try {
    const { username } = req.params; // Target user to follow
    const { followerUsername } = req.body; // The user who is doing the following

    const targetUser = await prisma.user.findFirst({ where: { username: { equals: username, mode: 'insensitive' } } });
    const followerUser = await prisma.user.findFirst({ where: { username: { equals: followerUsername, mode: 'insensitive' } } });

    if (!targetUser || !followerUser) return res.status(404).json({ error: "User not found" });
    if (targetUser.id === followerUser.id) return res.status(400).json({ error: "Cannot follow yourself" });

    await prisma.userFollows.create({
      data: {
        followerId: followerUser.id,
        followingId: targetUser.id
      }
    });

    res.json({ success: true });
  } catch (error) {
    // Ignore unique constraint failures if they are already following
    if (error.code === 'P2002') return res.json({ success: true });
    
    console.error("Error following user:", error);
    res.status(500).json({ error: "Failed to follow user" });
  }
}

// Unfollow a user
async function unfollowUser(req, res) {
  try {
    const { username } = req.params;
    const { followerUsername } = req.body;

    const targetUser = await prisma.user.findFirst({ where: { username: { equals: username, mode: 'insensitive' } } });
    const followerUser = await prisma.user.findFirst({ where: { username: { equals: followerUsername, mode: 'insensitive' } } });

    if (!targetUser || !followerUser) return res.status(404).json({ error: "User not found" });

    await prisma.userFollows.deleteMany({
      where: {
        followerId: followerUser.id,
        followingId: targetUser.id
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    res.status(500).json({ error: "Failed to unfollow user" });
  }
}

module.exports = {
  getProfile,
  updateProfile,
  searchUsers,
  followUser,
  unfollowUser,
};

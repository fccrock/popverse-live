const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Get all notifications for a specific user (by username)
async function getUserNotifications(req, res) {
  try {
    const { username } = req.params;

    const user = await prisma.user.findFirst({
      where: { username: { equals: username, mode: "insensitive" } },
    });
    if (!user) return res.json([]);

    // Auto-cleanup: delete notifications older than 30 days for this user
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    await prisma.notification.deleteMany({
      where: {
        userId: user.id,
        createdAt: { lt: thirtyDaysAgo }
      }
    });

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      include: {
        actor: {
          select: {
            username: true,
            displayName: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
}

// Mark a single notification as read
async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    
    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
    
    res.json(notification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to update notification" });
  }
}

// Mark all unread notifications as read for a user
async function markAllAsRead(req, res) {
  try {
    const { username } = req.params;
    
    const user = await prisma.user.findFirst({
      where: { username: { equals: username, mode: "insensitive" } },
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    await prisma.notification.updateMany({
      where: { 
        userId: user.id,
        isRead: false
      },
      data: { isRead: true }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: "Failed to update notifications" });
  }
}

// Delete a notification (optional if user wants to dismiss it)
async function deleteNotification(req, res) {
  try {
    const { id } = req.params;
    await prisma.notification.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
}

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};

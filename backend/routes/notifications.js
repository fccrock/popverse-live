const express = require("express");
const router = express.Router();
const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
  deleteNotification,
} = require("../controllers/notifications.controller");

router.get("/:username", getUserNotifications);
router.put("/:id/read", markAsRead);
router.put("/:username/read-all", markAllAsRead);
router.delete("/:username/clear-all", clearAllNotifications);
router.delete("/:id", deleteNotification);

module.exports = router;

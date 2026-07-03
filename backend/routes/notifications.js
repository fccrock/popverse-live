const express = require("express");
const router = express.Router();
const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require("../controllers/notifications.controller");

router.get("/:username", getUserNotifications);
router.put("/:id/read", markAsRead);
router.put("/:username/read-all", markAllAsRead);
router.delete("/:id", deleteNotification);

module.exports = router;

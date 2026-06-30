const express = require("express");
const router = express.Router();
const usersController = require("../controllers/users.controller");

router.get("/check/:username", usersController.checkUsername);
router.get("/search", usersController.searchUsers);
router.get("/:username", usersController.getProfile);
router.put("/:username", usersController.updateProfile);
router.post("/:username/follow", usersController.followUser);
router.post("/:username/unfollow", usersController.unfollowUser);

module.exports = router;

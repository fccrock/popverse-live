const express = require("express");
const router = express.Router();
const clubsController = require("../controllers/clubs.controller");

router.get("/", clubsController.getClubs);
router.post("/", clubsController.createClub);
router.post("/:clubId/join", clubsController.joinClub);
router.post("/:clubId/leave", clubsController.leaveClub);
router.post("/:clubId/posts", clubsController.createPost);
router.delete("/:clubId/posts/:postId", clubsController.deletePost);
router.post("/:clubId/posts/:postId/like", clubsController.likePost);
router.post("/:clubId/discussions", clubsController.createDiscussion);
router.delete("/:clubId/discussions/:discussionId", clubsController.deleteDiscussion);
router.post("/:clubId/discussions/:discussionId/replies", clubsController.createReply);
router.delete("/:clubId/discussions/:discussionId/replies/:replyId", clubsController.deleteReply);

module.exports = router;

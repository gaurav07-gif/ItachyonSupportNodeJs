const express = require("express");
const {
    addTaskComments, getTaskComments,getComment, deleteComment
} = require("../controllers/taskCommentController");

const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.route("/add/:taskId").post(protect, addTaskComments);
router.route("/get/:taskId").get(protect, getTaskComments);
router.route("/getcomment/:commentId").get(protect, getComment);
router.route("/delete/:commentId").get(protect, deleteComment);
module.exports = router;
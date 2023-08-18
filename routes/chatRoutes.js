const express = require("express");
const {
  accessChat,
  fetchChats,
  createGroupChat,
  removeFromGroup,
  addToGroup,
  renameGroup,
  getGroupChat,
  searchMemberInGrp,
resetUnreadCount

} = require("../controllers/chatControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").post(protect, accessChat);
router.route("/").get(protect, fetchChats);
router.route("/group").post(protect, createGroupChat);
router.route("/rename").put(protect, renameGroup);
router.route("/groupremove").put(protect, removeFromGroup);
router.route("/groupadd").put(protect, addToGroup);
router.route("/getGroupChat").get(protect, getGroupChat);
router.route("/searchMemberInGrp").get(protect, searchMemberInGrp);
//READ MESSAGES
router.route("/:chatId/readMessages").put(protect, resetUnreadCount);


module.exports = router;

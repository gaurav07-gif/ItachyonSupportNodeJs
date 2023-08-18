const express = require("express");
const {
  addTask,
  completeTask,
  getTask,
  getTaskData,
  getTaskByStatus,
  getTaskDataLast30Days,
  getTaskDataLast7Days,
  getTaskByRole,
  pauseTask,
  renewTask,
  addResultFromComment,
  startTask,
  updateTask,
  editComment,
  getTasksByProjectId
} = require("../controllers/taskController");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.route("/addTask").post(protect, addTask);
router.route("/tasks/:taskId/complete").put(protect, completeTask);
router.route("/tasks/:taskId").get(protect, getTask);
router.route("/tasks").get(protect, getTaskData);
router.route("/tasks/status/:status").get(protect, getTaskByStatus);
router.route("/getTaskDataLast30Days").get(protect, getTaskDataLast30Days);
router.route("/getTaskDataLast7Days").get(protect, getTaskDataLast7Days);
router.route("/tasks/filter").get(protect, getTaskByRole);
//http://localhost:8000/tasks/filter?createdBy=:id
router.route("/tasks/:taskId/pause").put(protect, pauseTask);
router.route("/tasks/:taskId/renew").put(protect, renewTask);
router.route("/tasks/:taskId/result").put(protect, addResultFromComment);
router.route("/tasks/:taskId/startTask").put(protect, startTask);
router.route("/tasks/:taskId/updateTask").put(protect, updateTask);
router.route("/tasks/:taskId/comments/:commentId").put(protect, editComment);//newly added for editing the comment
router.route("/tasks/project/:projectId").get(protect, getTasksByProjectId)
module.exports = router;

const express = require("express");
const {
 createProject,
 getProjects,
 updateProject,
getProjectById,
updateOnTimeInterval
} = require("../controllers/projectController");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.route("/").post(protect, createProject);
router.route("/").get(protect, getProjects);
router.route("/updateProject/:id").put(protect, updateProject);
router.route("/getproject/:id").get(protect, getProjectById);
router.route('/updateOnTimeInterval/:id').put(protect,updateOnTimeInterval);

module.exports = router;
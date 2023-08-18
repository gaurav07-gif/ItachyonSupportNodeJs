const express = require("express");
const {
    postClinic,
    getClinicData,
    updateClinic,
    deleteClinic,
    removeUserFromClinic
} =  require('../controllers/clinicController');
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.route("/postClinic").post(protect, postClinic);
router.route("/GetClinicData").get(protect, getClinicData);
router.route('/update/:clinicId').put(protect, updateClinic);
router.route('/delete/:clinicId').delete(protect, deleteClinic);
router.route('/removeUser/:clinicId').put(protect, removeUserFromClinic);

module.exports = router;

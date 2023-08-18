const express=require('express');
const router=express.Router();
const handleAllUsers= require('../controller/clinicController');
const authToken = require('../middleware/authenticateToken');

router.post('/postClinic',authToken.authenticateToken,handleAllUsers.postClinic);
router.get('/GetClinicData',authToken.authenticateToken,handleAllUsers.getClinicData);

module.exports=router;
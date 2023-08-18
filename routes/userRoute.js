const express=require('express');
const router=express.Router();
const handleAllUsers= require('../controller/userController');
const authToken = require('../middleware/authenticateToken')


router.post('/auth',handleAllUsers.loginUser);
router.post('/refreshToken',handleAllUsers.refreshAccessToken);
router.get('/GetUserData',authToken.authenticateToken,handleAllUsers.getData);
router.get('/GetCurrentUserData/:id',authToken.authenticateToken,handleAllUsers.getCurrentUserData);
module.exports=router;
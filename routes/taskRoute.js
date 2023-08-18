const express=require('express');
const router=express.Router();
// const handleAllUsers= require('../controller/taskController');
// const handleAllUsers = require('../controller/taskController')
const authToken = require('../middleware/authenticateToken');

router.post('/addTask',authToken.authenticateToken,handleAllUsers.addTask);
router.put('/tasks/:taskId/complete',authToken.authenticateToken,handleAllUsers.completeTask);
router.get('/tasks/:taskId',authToken.authenticateToken,handleAllUsers.getTask);
router.get('/tasks/',authToken.authenticateToken,handleAllUsers.getTaskData);
router.get('/tasks/status/:status',authToken.authenticateToken,handleAllUsers.getTaskByStatus);
router.get('/getTaskDataLast30Days',authToken.authenticateToken,handleAllUsers.getTaskDataLast30Days);
router.get('/getTaskDataLast7Days',authToken.authenticateToken,handleAllUsers.getTaskDataLast7Days);
router.get('/tasks/filter',authToken.authenticateToken,handleAllUsers.getTaskByRole);
//http://localhost:8000/tasks/filter?createdBy=B sir
router.put('/tasks/:taskId/pause',authToken.authenticateToken,handleAllUsers.pauseTask);
router.put('/tasks/:taskId/renew',authToken.authenticateToken,handleAllUsers.renewTask);
router.put('/tasks/:taskId/result',authToken.authenticateToken,handleAllUsers.addResultFromComment);
router.put('/tasks/:taskId/startTask',authToken.authenticateToken,handleAllUsers.startTask);
router.put('/tasks/:taskId/updateTask',authToken.authenticateToken,handleAllUsers.updateTask);
router.get('/tasks/project/:projectId',authToken.authenticateToken,handleAllUsers.getTasksByProjectId)
// router.get('/crm/deal/add',authToken.authenticateToken,handleAllUsers.createDeal);

module.exports=router;
const Task = require("../models/TaskModel")
const Project = require("../models/projectModel");
const axios = require("axios");
const admin = require("firebase-admin");
const User = require("../models/userModel")
const serviceAccount = require("../config/serviceAccountKey.json");
// CONNECTION WITH FIREBASE
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://itachyon-support-ac993.firebaseio.com",
  });
} else {
  admin.app(); // Retrieve the already initialized app
}




const addTask = async (req, res) => {
  try {
    const loggedInUserId = req.user._id; // Assuming the user ID is available in the request after authentication
    const taskData = req.body;
    taskData.createdBy = loggedInUserId;
    taskData.projectId = req.body.projectId;

    // Make sure the participant field is an array
    if (!Array.isArray(taskData.participant)) {
      taskData.participant = []; // Set it as an empty array if not provided
    }

    if (!taskData.title || !taskData.description) {
      return res.status(400).json({ error: "Title and description are required fields" });
    }

    if (!Array.isArray(taskData.observers)) {
      taskData.observers = []; // Set it as an empty array if not provided
    }

    const task = new Task(taskData);
    const savedTask = await task.save();

    if (taskData.projectId) {
      // Get the project details
      const project = await Project.findById(taskData.projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Execute the automations for the project on the task in the background
      if (project.automations && project.automations.length > 0) {
        executeAutomationsOnTask(project.automations, savedTask._id);
      }
    }

    if (res.statusCode === 200) {
      const url = "https://me.itachyon.com/rest/27/xp77o5948rzldiuh/crm.deal.add.json";

      const data = {
        fields: {
          TITLE: taskData.title,
          UF_CRM_1683697473619: req.user.email,
          UF_CRM_632EC9E45AFBD: taskData.description,
          UF_CRM_1683702408727: req.user.email,
          UF_CRM_1675089346322: loggedInUserId,
          // UF_CRM_1675875292996: "creatorClinicName",
          "bxu_files[]": "",
        },
      };

      axios
        .post(url, data, {
          headers: {
            "Content-Type": "application/json",
          },
        })
        .then((response) => {
          if (response.status === 200) {
            console.log("Ticket created in Bitrix DB", response.status);
          } else {
            console.log("Ticket not created", response.status);
          }
        })
        .catch((error) => {
          console.error("Error from DB:", error);
        });
    }

    res.status(201).json(savedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create the task" });
  }
};

const executeAutomationsOnTask = async (automations, taskId) => {
  const task = await Task.findById(taskId);
  if (!task) {
    console.error('Task not found');
    return;
  }

  for (const automation of automations) {
    const { dataField, timeInterval, timeUnit, userId } = automation;

    // Convert the time interval to milliseconds based on the time unit
    let intervalInMillis = 0;
    switch (timeUnit) {
      case 'seconds':
        intervalInMillis = timeInterval * 1000;
        break;
      case 'minutes':
        intervalInMillis = timeInterval * 60 * 1000;
        break;
      case 'hours':
        intervalInMillis = timeInterval * 60 * 60 * 1000;
        break;
      default:
        throw new Error('Invalid time unit');
    }

    // Wait for the specified time interval
    await new Promise((resolve) => setTimeout(resolve, intervalInMillis));

    // Update the data field of the task with the provided value
    await Task.updateOne({ _id: taskId }, { $set: { [dataField]: userId } });
    console.log(`${dataField} updated:`, userId);
  }
};




//completed task.
const completeTask = async (req, res) => {
 const taskId = req.params.taskId;

 try {
   const task = await Task.findById(taskId);
   if (!task) {
     return res.status(404).json({ Error: "Task not found" });
   }

   task.status = 5; // Set status to "Completed"
   const completedTask = await task.save();

   res.status(200).json(completedTask);
 } catch (error) {
   res.status(500).json({ Error: "Failed to complete the task" });
 }
};

//getTask
const getTask = async (req, res) => {
 const taskId = req.params.taskId;

 try {
   const task = await Task.findById(taskId).sort({ createdAt: -1 })
   .populate({
    path: "responsible",
    model: "userLogin",    
  })
  .populate({
    path: "participant",
    model: "userLogin",    
  })
  .populate({
    path: "observers",
    model: "userLogin",    
  })
  .populate({
    path: "createdBy",
    model: "userLogin",    
  });
   
   if (!task) {
     return res.status(404).json({ Error: "Task not found" });
   }

   res.status(200).json(task);
 } catch (error) {
   res.status(500).json({ Error: "Failed to retrieve task data" });
 }
};



//getTaskData by createdBy or responsible or participant or observers in Descending order

const getTaskData = async (req, res) => {
  try {
    // Check if the user is logged in
    const loggedInUserId = req.user._id; // Assuming the user ID is available in the request after authentication
    console.log(loggedInUserId);

    // Retrieve pagination parameters from the request body
    const { page = 1, limit = 250 } = req.body;
    const skip = (page - 1) * limit;

    // Find the tasks associated with the logged-in user with pagination
    const tasks = await Task.find({
      $or: [
        { createdBy: loggedInUserId },
        { responsible: loggedInUserId },
        { participant: loggedInUserId },
        { observers: loggedInUserId },
      ],
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate({
        path: "projectId",
        model: "Project",    
      })
      .populate({
        path: "responsible",
        model: "userLogin",    
      })
      .populate({
        path: "participant",
        model: "userLogin",    
      })
      .populate({
        path: "observers",
        model: "userLogin",    
      })
      .populate({
        path: "createdBy",
        model: "userLogin",    
      });

    if (tasks.length === 0) {
      return res.status(404).json({ Error: "No tasks found for the user" });
    }

    // Return the task data in the response
    res.json({
      status: 200,
      message: "success",
      data: tasks,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ Error: "Failed to retrieve task data" });
  }
};



//getTask by status
const getTaskByStatus = async (req, res) => {
  try {
    // Check if the user is logged in
    const loggedInUserId = req.user._id; // Assuming the user ID is available in the request after authentication

    const { status } = req.params; // Assuming the status is provided as a query parameter

    // Retrieve pagination parameters from the request body
    const { page = 1, limit = 250 } = req.body;
    const skip = (page - 1) * limit;

    // Find the tasks associated with the logged-in user and matching status with pagination
    const tasks = await Task.find({
      $or: [
        { createdBy: loggedInUserId },
        { responsible: loggedInUserId },
        { participant: loggedInUserId },
        { observers: loggedInUserId },
      ],
      status: status, // Filter tasks based on the provided status
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate({
        path : "createdBy",
        model : "userLogin",    
      })
      .populate({
        path: "projectId",
        model: "Project",    
      })
      .populate({
        path: "responsible",
        model: "userLogin",    
      })
      .populate({
        path: "participant",
        model: "userLogin",    
      })
      .populate({
        path: "observers",
        model: "userLogin",    
      })
      

    if (tasks.length === 0) {
      return res
        .status(404)
        .json({ Error: "No tasks found with the given status" });
    }
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ Error: "Failed to retrieve task data" });
  }
};


// const getTaskByStatus = async (req, res) => {
//   const status = req.params.status;

//   try {
//     const tasks = await Task.find({ status: status });

//     if (tasks.length === 0) {
//       return res.status(404).json({ error: "No tasks found with the given status" });
//     }

//     res.status(200).json(tasks);
//   } catch (error) {
//     res.status(500).json({ error: "Failed to retrieve task data" });
//   }
// };

//gettingTaskData for 30days
const getTaskDataLast30Days = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    console.log(loggedInUserId);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Retrieve pagination parameters from the request body
    const { page = 1, limit = 250 } = req.body;
    const skip = (page - 1) * limit;

    const tasks = await Task.find({
      $or: [
        { createdBy: loggedInUserId },
        { responsible: loggedInUserId },
        { participant: loggedInUserId },
        { observers: loggedInUserId },
      ],
      createdAt: { $gte: thirtyDaysAgo },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate({
        path: "responsible",
        model: "userLogin",    
      })
      .populate({
        path: "participant",
        model: "userLogin",    
      })
      .populate({
        path: "observers",
        model: "userLogin",    
      })
      .populate({
        path: "createdBy",
        model: "userLogin",    
      });
       
      ;

    if (tasks.length === 0) {
      return res
        .status(404)
        .json({ Error: "No tasks found within the last 30 days" });
    }

    res.json({
      status: 200,
      message: "success",
      data: tasks,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ Error: "Failed to retrieve task data", details: error.message });
  }
};

const getTaskDataLast7Days = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    console.log(loggedInUserId);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Retrieve pagination parameters from the request body
    const { page = 1, limit = 250 } = req.body;
    const skip = (page - 1) * limit;

    const tasks = await Task.find({
      $or: [
        { createdBy: loggedInUserId },
        { responsible: loggedInUserId },
        { participant: loggedInUserId },
        { observers: loggedInUserId },
      ],
      createdAt: { $gte: sevenDaysAgo },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate({
        path: "responsible",
        model: "userLogin",    
      })
      .populate({
        path: "participant",
        model: "userLogin",    
      })
      .populate({
        path: "observers",
        model: "userLogin",    
      })
      .populate({
        path: "createdBy",
        model: "userLogin",    
      });
       ;

    if (tasks.length === 0) {
      return res
        .status(404)
        .json({ Error: "No tasks found within the last 7 days" });
    }

    res.json({
      status: 200,
      message: "success",
      data: tasks,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ Error: "Failed to retrieve task data", details: error.message });
  }
};


const getTaskByRole = async (req, res) => {
  const { createdBy, responsible, participant, observers } = req.query;
  try {
    if (!createdBy && !responsible && !participant && !observers) {
      return res.status(400).json({ Error: "err" });
    }

    const query = {};

    if (createdBy) {
      query.createdBy = createdBy;
    }

    if (responsible) {
      query.responsible = responsible;
    }

    if (participant) {
      query.participant = participant;
    }

    if (observers) {
      query.observers = observers;
    }

    // Retrieve pagination parameters from the request body
    const { page = 1, limit = 250 } = req.body;
    const skip = (page - 1) * limit;

    const tasks = await Task.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate({
        path: "responsible",
        model: "userLogin",    
      })
      .populate({
        path: "participant",
        model: "userLogin",    
      })
      .populate({
        path: "observers",
        model: "userLogin",    
      })
      .populate({
        path: "createdBy",
        model: "userLogin",    
      });
       

    if (tasks.length === 0) {
      return res.status(404).json({ Error: "No tasks found" });
    }

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ Error: "Failed to retrieve task data" });
  }
};


//pause task
const pauseTask = async (req, res) => {
 const taskId = req.params.taskId;

 try {
   const task = await Task.findById(taskId);
   if (!task) {
     return res.status(404).json({ Error: "Task not found" });
   }

   task.status = 2; // Set status to "Pending"
   const pausedTask = await task.save();

   res.status(200).json(pausedTask);
 } catch (error) {
   res.status(500).json({ Error: "Failed to pause the task" });
 }
};

//renew a task
const renewTask = async (req, res) => {
 const taskId = req.params.taskId;

 try {
   const task = await Task.findById(taskId);
   if (!task) {
     return res.status(404).json({ Error: "Task not found" });
   }

   task.status = 2; // Set status to "Pending"
   task.closedTask = 0; // Reset closedTask to 0
   task.closedOn = null; // Reset closedOn to null
   const renewedTask = await task.save();

   res.status(200).json(renewedTask);
 } catch (error) {
   res.status(500).json({ Error: "Failed to renew the task" });
 }
};

//Add comment Task
const addResultFromComment = async (req, res) => {
  const taskId = req.params.taskId;
  const commentText = req.body.text;
 
  try {
     const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ Error: "Task not found" });
    }
 
    const newComment = {
      authorId: req.user._id,
      text: commentText,
      createdAt: new Date(),
      updatedAt: new Date()
    };
 
    task.comments.push(newComment); // Add the new comment to the task's comments array
    const updatedTask = await task.save();
 
    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ Error: error });
  }
 };
 const editComment = async (req, res) => {
  const taskId = req.params.taskId;
  const commentId = req.params.commentId;
  const newText = req.body.text;
  const updatedBy = req.user._id; // Assuming you have the user's ID available in req.user._id
 
  try {
     const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ Error: "Task not found" });
    }
 
    const comment = task.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ Error: "Comment not found" });
    }
 
    // Check if the user is the admin
    if (req.user.userRole !== 'admin') {
      return res.status(403).json({ Error: "Unauthorized access" });
    }
 
    comment.text = newText;
    comment.updatedAt = Date.now(); // Update the updatedAt timestamp
    comment.updatedBy = updatedBy; // Se t the updatedBy field
 
    const updatedTask = await task.save();
 
    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ Error: error });
  }
 };
//Start Task:-

const startTask = async (req, res) => {
 const taskId = req.params.taskId;

 try {
   const task = await Task.findById(taskId);
   if (!task) {
     return res.status(404).json({ Error: "Task not found" });
   }

   task.status = 3; // Se t status to "In Progress"
   const progressTask = await task.save();

   res.status(200).json(progressTask);
 } catch (error) {
   res.status(500).json({ Error: "Failed to pause the task" });
 }
};

//Update Task

const updateTask = async (req, res) => {
 const taskId = req.params.taskId;
 const updates = req.body;

 try {
   const task = await Task.findByIdAndUpdate(taskId, updates, { new: true });

   if (!task) {
     return res.status(404).json({ Error: "Task not found" });
   }

   res.status(200).json(task);
 } catch (error) {
   res.status(500).json({ Error: "Failed to update task" });
 }
}


//fetch Task of the Project
const getTasksByProjectId = async (req, res) => {
  try {
    const loggedInUserId = req.user._id; // Assuming the user ID is available in the request after authentication
    const { projectId } = req.params; // Assuming the selected projectId is available in the request body
    

    const project = await Project.findOne({
      _id: projectId,
      $or: [
        { projectOwner: loggedInUserId },
        { moderator: loggedInUserId },
      ],
    })
    
    let tasks;
    if (project) {
      tasks = await Task.find({ projectId })
      .populate({
        path: "responsible",
        model: "userLogin",    
      })
      .populate({
        path: "participant",
        model: "userLogin",    
      })
      .populate({
        path: "observers",
        model: "userLogin",    
      })
      .populate({
        path: "createdBy",
        model: userLogin,    
      });;
     
    } else {
      tasks = await Task.find({ 
        projectId,
        $or: [
          { createdBy: loggedInUserId },
          { responsible: loggedInUserId },
          { participant: loggedInUserId },
          { observers: loggedInUserId },
        ],
        
      })
      .populate({
        path: "responsible",
        model: "userLogin",    
      })
      .populate({
        path: "participant",
        model: "userLogin",    
      })
      .populate({
        path: "observers",
        model: "userLogin",    
      })
      .populate({
        path: "createdBy",
        model: "userLogin",    
      });
  
    }
     console.log(tasks)
    if (tasks.length === 0) {
      return res
        .status(404)
        .json({ Error: "No tasks found for the user and selected project" });
    }
    

    // Return the task data in the response
    res.json(tasks)
   
  } catch (error) {
    console.error(error);
    res.status(500).json({ Error: "Failed to retrieve task data" });
  }
};


module.exports = {
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
};
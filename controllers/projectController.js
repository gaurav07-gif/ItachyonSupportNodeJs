const Project = require("../models/projectModel");
const Chat = require("../models/chatModel");
const mongoose=require('mongoose')
const createProject = async (req, res) => {
  try {
    const projectData = req.body;
    const userId = req.user.id;
    projectData.projectOwner = [userId];

    const project = new Project(projectData);
    const savedProject = await project.save();

    // Create a chat group for the project
    const chatData = {
      title: savedProject.projectName,
      description: savedProject.projectDescription,
      projectId: savedProject._id, // Save the project ID in the chat
      isGroupChat: true,
      users: savedProject.members.concat(savedProject.projectOwner),
      authorId: savedProject.projectOwner,
      unreadCounts: savedProject.members
        .concat(savedProject.projectOwner)
        .map((user) => ({
          user: user,
          count: 0,
        })),
    };

    const createdChat = await Chat.create(chatData);

    res.status(201).json(savedProject);
    // console.log(savedProject);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to create the project" });
  }
};



const getProjects = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming the user ID is available in req.user.id after authentication

    const projects = await Project.find({
      $or: [
        { projectOwner: userId }, // Check if the user is the owner
        { members: userId }, // Check if the user is a team member
      ],
    })
    .populate({
      path: "moderator",
      model: "userLogin",    
    })

    .populate({
      path: "projectOwner",
      model: "userLogin",
      
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
        path: "observer",
        model: "userLogin",
       
      })
      .populate({
        path: "members",
        model: "userLogin",
      
      });

    console.log("Projects:");
    console.log(projects);

    res.status(200).json(projects);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};



const updateProject = async (req, res) => {
  try {
    const projectId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid projectId" });
    }

    const projectData = req.body;
    const existingProject = await Project.findById(projectId);
    if (!existingProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Get the existing member IDs
    const existingMembers = existingProject.members;

    // Filter out the member IDs that already exist in the project
    const newMembers = projectData.members.filter(
      (memberId) => !existingMembers.includes(memberId)
    );

    const updatedMembers = [...existingMembers, ...newMembers];
    // Update the project with the merged members
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { $set: { members: updatedMembers } },
      { new: true }
    );
    // Update the chat with the new members
    const chat = await Chat.findOneAndUpdate(
      { projectId: updatedProject._id },
      {
        $push: {
          users: { $each: newMembers },
          unreadCounts: {
            $each: newMembers.map((user) => ({
              user,
              count: 0,
            })),
          },
        },
      },
      { new: true}
      
    );
    res.status(200).json(updatedProject);
    
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};


const getProjectById = async (req, res) => {
 try {
    const userId = req.user.id;
   const projectId = req.params.id; // Assuming the project ID is passed as a route parameter

   const project = await Project.findOne({
     _id: projectId,
     $or: [
       { projectOwner: req.user.id }, // Check if the user is the owner
       { members: req.user.id }, // Check if the user is a team member
     ],
   })
   .populate({
    path: "moderator",
    model: "userLogin",    
  })

  .populate({
    path: "projectOwner",
    model: "userLogin",
    
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
      path: "observer",
      model: "userLogin",
     
    })
    .populate({
      path: "members",
      model: "userLogin",
    
    });;

   if (!project) {
     return res.status(404).json({ message: "Project not found" });
   }

   res.status(200).json(project);
 } catch (error) {
   console.error("Error:", error.message);
   res.status(500).json({ message: "Server error" });
 }
};




const updateOnTimeInterval = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { automations } = req.body;

    // Find the project by projectId
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Update the automations field of the project
    project.automations = automations;

    // Save the updated project with automations
    await project.save();

    res.status(200).json({ message: 'Automations updated in the project' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to update the automations in the project' });
  }
};



module.exports = {
  createProject,
  getProjects,
  updateProject,
getProjectById,
updateOnTimeInterval
};

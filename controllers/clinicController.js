const Clinic = require("../models/clinicModel");
const Chat = require("../models/chatModel")
const Project= require("../models/projectModel")






// CREATE A CLINIC AND CHAT OF THAT CLINIC
// const postClinic = async (req, res, next) => {
//   try {
//     const loggedInUserId= req.user._id
//     const clinicData = req.body;
//     clinicData.createdBy = loggedInUserId;

    
//     const clinic = new Clinic(clinicData);
//     const savedClinic = await clinic.save();

//     // CREATE A CHAT GROUP FOR THE CLINIC
//     const chatData = {
//       clinicId: savedClinic._id,
//       authorId:savedClinic.createdBy,
//       title: savedClinic.clinicName,
//       description: savedClinic.description, 
//       isGroupChat: true,  
//       users: savedClinic.users|| [], 
    
//     };

//     const createdChat = await Chat.create(chatData);

//     res.status(201).json(savedClinic);
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).json({ error: "Failed to create the clinic!!" });
//   }
// };


const postClinic = async (req, res, next) => {
  try {
    const loggedInUserId = req.user._id;
    const clinicData = req.body;
    clinicData.createdBy = loggedInUserId;

    // Find the project by projectId
    const project = await Project.findOne({ _id: clinicData.projectId }).populate('projectOwner');

    // Check if the project exists
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Extract the project owner from the project
    const projectOwner = project.projectOwner;

    // Check if the project owner exists
    if (!projectOwner) {
      return res.status(404).json({ error: "Project owner not found" });
    }

    // Assign the project owner to the manager field
    clinicData.manager = projectOwner;

    const clinic = new Clinic(clinicData);
    const savedClinic = await clinic.save();

    // CREATE A CHAT GROUP FOR THE CLINIC
    const chatData = {
      title: savedClinic.clinicName,
      description: savedClinic.description,
      clinicId: savedClinic._id,
      isGroupChat: true,
      authorId: savedClinic.createdBy,
      users: savedClinic.users || [],
    };

    const createdChat = await Chat.create(chatData);

    res.status(201).json(savedClinic);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to create the clinic" });
  }
};


// GET CLINIC DATA
  const getClinicData = async (req, res, next) => {
    try {
      // Retrieve pagination parameters from the request body
      const { page = 1, limit = 250 } = req.body;
      const skip = (page - 1) * limit;
  
      const clinics = await Clinic.find().skip(skip).limit(Number(limit))
      .populate({
        path: "projectId",
        model: "Project",    
      })
      .populate({
        path: "users",
        model: "userLogin",    
      })
      .populate({
        path: "createdBy",
        model: "userLogin",    
      })
      .populate({
        path: "manager",
        model: "userLogin",    
      })
      ;
  
      if (clinics.length > 0) {
        res.send(clinics);
      } else {
        res.send({ result: "No clinic info. found!!" });
      }
    } catch (error) {
      next(error);
    }
  };
  
  


  
  // UPDATE CLINIC DATA AND IT WILL ALSO UPDATE THE CHAT OF THE CLINIC
  const updateClinic = async (req, res) => {
    try {
      const clinicId = req.params.clinicId;
      const updateData = req.body;
  
      // RETRIEVE THE CURRENT USERS OF THE USERS ARRAY
      const clinic = await Clinic.findById(clinicId);
      const currentUsers = clinic.users;
  
      // FILTER EXISTING USERS FROM THE NEW USERS
      const newUsers = updateData.users.filter(userId => !currentUsers.includes(userId));
  
      // MERGE THE NEW USERS WITH THE CURRENT USERS
      const mergedUsers = [...currentUsers, ...newUsers];
  
      // UPDATE CLINIC DATA
      const updatedClinic = await Clinic.findByIdAndUpdate(
        clinicId,
        { ...updateData, users: mergedUsers },
        { new: true }
      );
  
      if (!updatedClinic) {
        return res.status(404).json({ error: "Clinic not found!!" });
      }
  
      // UPDATE CHAT DATA
      const chat = await Chat.findOneAndUpdate(
        { clinicId: updatedClinic._id },
        {
          title: updatedClinic.clinicName,
          // description: updatedClinic.description,
          users: updatedClinic.users,
          authorId: updatedClinic.createdBy,  
        },
        { new: true }
      );
  
      res.json({ clinic: updatedClinic, chat: chat });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Failed to update the clinic!!" });
    }
  };
  



  
  // DELETE THE CLINIC DATA ALONG WITH CHAT 

  const deleteClinic = async (req, res) => {
    try {
      const clinicId = req.params.clinicId;
  
      // DELETE THE CLINIC
      const deletedClinic = await Clinic.findByIdAndDelete(clinicId);
  
      if (!deletedClinic) {
        return res.status(404).json({ error: "Clinic not found!!" });
      }
  
      // DELETE THE CHAT ALONG WITH THE CLINIC
      const deletedChat = await Chat.findOneAndDelete({ clinicId: clinicId });
  
      res.json({ message: "Clinic and chat have been deleted" });

    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Failed to delete the clinic!!" });
    }
  };
  


  const removeUserFromClinic = async (req, res) => {
    try {
      const clinicId = req.params.clinicId;
      const userId = req.body.userId;
  
      // REMOVE USER FROM CLINIC
      const updatedClinic = await Clinic.findByIdAndUpdate(
        clinicId,
        // { $pull: { users: userId } },
        { $pull: { users: { $in: userId } } },
        { new: true }
      );
  
      if (!updatedClinic) {
        return res.status(404).json({ error: "Clinic not found!!" });
      }
  
      // REMOVE USER FROM CHAT
      const chat = await Chat.findOneAndUpdate(
        { clinicId: updatedClinic._id },
        // { $pull: { users: userId } },
        { $pull: { users: { $in: userId } } },
        { new: true }
      );
  
      res.json({ message: "User has removed from the clinic and the chat" });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Failed to remove the user from the clinic and chat!!" });
    }
  };
  

  
  module.exports = {
    postClinic,
    getClinicData,
    updateClinic,
    deleteClinic,
    removeUserFromClinic
  }
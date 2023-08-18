const TaskComment = require("../models/taskCommentModel");
//ADD COMMENT TO THE TASK
const addTaskComments = async (req, res) => {
  try {
       const commentData = req.body;
       commentData.authorId = req.user._id;
       commentData.taskId = req.params.taskId;
       const taskcomment = new TaskComment(commentData);
       const savedTaskComment = await taskcomment.save();
       const commentNum = await TaskComment.countDocuments({ taskId: req.params.taskId });
       const task = await Task.findById(req.params.taskId);
       task.numberOfComments = commentNum; // Set status to "Pending"
       const savenumComment = await task.save();
       res.status(201).json(savedTaskComment);
  } catch (error) {
       res.status(500).json({ Error: error });
  }
  };
//GET THE TASK DETAILS
const getComment = async (req, res) => {
  const id = req.params.commentId;   
  console.log(id);
      try {
        const comment = await TaskComment.findById(id).sort({ createdAt: -1 })
        .populate({
          path: "authorId",
          model: "userLogin",    
        })
        .populate({
          path: "taskId",
          model: "Task",    
        })
        .populate({
          path: "updatedBy",
          model: "userLogin",    
        })
        .populate({
          path: "parentCommentId",
          model: "TaskComment",    
        })
        ;
        
        if (!comment) {
          return res.status(404).json({ Error: "Task Comment not found" });
        }
        res.status(200).json(comment);
      } catch (error) {
        res.status(500).json({ Error: "Failed to retrieve task data" });
      }
};


// GET THE COMMENTS OF TASK
const getTaskComments = async (req, res) => {
const taskId = req.params.taskId;   
    try {
      const comments = await TaskComment.find({ taskId: taskId }).sort({ createdAt: -1 })
      .populate({
        path: "authorId",
        model: "userLogin",    
      })
      .populate({
        path: "taskId",
        model: "Task",    
      })
      .populate({
        path: "updatedBy",
        model: "userLogin",    
      })
      .populate({
        path: "parentCommentId",
        model: "TaskComment",    
      });
      if (!comments) {
        return res.status(404).json({ Error: "Task Comments not found" });
      }
      res.status(200).json(comments);
    } catch (error) {
      res.status(500).json({ Error: "Failed to retrieve task data" });
    }
   };



//DELETE THE COMMENT
const deleteComment = async (req, res) =>{
  const commentId = req.params.commentId;
  const dlt= await TaskComment.findByIdAndDelete(commentId);
  if(!dlt){
    return res.status(404).json({ Error: "Comments not found" });
  }
  res.status(200).json({sucess: "Comment deleted successfully", dlt});

}

module.exports = {
  addTaskComments, getTaskComments, getComment, deleteComment
};
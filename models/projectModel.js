const mongoose = require('mongoose');

// Define the project schema
const projectSchema = new mongoose.Schema(
  {
    projectName: {
      type: String,
      required: true
    },
    projectDescription: {
      type: String,
      required: true
    },
    projectOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userLogin"
    },
    moderator: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "userLogin"
    }],
    members: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "userLogin"
    }],
    responsible: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "userLogin"
    }],
    participant: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "userLogin"
    }],
    observer: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "userLogin"
    }],
    automations: [{
      dataField: {
        type: String,
        required: true
      },
      timeInterval: {
        type: Number,
        required: true
      },
      timeUnit: {
        type: String,
        enum: ['seconds', 'minutes', 'hours'],
        required: true
      },
      userId:  [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "userLogin"
      }]
    }]
  },
  {
    timestamps: true
  }
);

// Create the Project model
const Project = mongoose.model('Project', projectSchema);

module.exports = Project;

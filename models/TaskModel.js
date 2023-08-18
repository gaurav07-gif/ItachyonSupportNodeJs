const mongoose = require("mongoose");
const taskSchema = new mongoose.Schema(
  {
    //groupId:{ type: mongoose.Schema.Types.ObjectId, ref: "Chat"},
    projectId:{ type: mongoose.Schema.Types.ObjectId, ref: "Project"},
    title: { type: String, required: true },
    description: { type: String, required: true },
    priority: { type: Number, enum: [2, 1, 0], default: 1 },
    status: { type: Number, enum: [2, 3, 4, 5, 6], default: 2 },
    multitask: { type: String, enum: ["Y", "N"], default: "N" },
    repeatTask: { type: String, enum: ["Y", "N"], default: "N" },
    project: { type: Number, default: 0 },
    stage: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "UserLogin" },
    responsible: [{ type: mongoose.Schema.Types.ObjectId, ref: "UserLogin" }],
    participant: [{ type: mongoose.Schema.Types.ObjectId, ref: "UserLogin" }],
    observers: [{ type: mongoose.Schema.Types.ObjectId, ref: "UserLogin" }],
    modifiedBy: { type: Number },
    modifiedOn: { type: Date },
    statusModifiedBy: { type: Number },
    closedTask: { type: Number },
    closedOn: { type: Date },
    startDate: { type: Date, default: null },
    deadline: { type: Date },
    plannedStart: { type: Date },
    plannedFinish: { type: Date },
    GUID: { type: String, default: null },
    numberOfComments: { type: Number, default: 0 },
    numberOfNewComments: { type: Number, default: 0 },
    allowChangeDeadlines: { type: String, enum: ["Y", "N"], default: "N" },
    accept: { type: String, enum: ["Y", "N"], default: "N" },
    addToReport: { type: String, enum: ["Y", "N"], default: "N" },
    createdFromTemplate: { type: String, enum: ["Y", "N"], default: "N" },
    timeSpent: { type: Number },
    timeSpentFromHistory: { type: Number },
    skipWeekend: { type: Number },
    forumTopicID: { type: Number },
    forumID: { type: Number },
    siteID: { type: String },
    subordinateTask: { type: String, enum: ["Y", "N"], default: "N" },
    addedToFavorites: { type: String, enum: ["Y", "N"], default: "N" },
    exchangeID: { type: Number },
    outlookVersion: { type: Number },
    lastViewDate: { type: Date },
    sortIndex: { type: Number },
    durationPlan: { type: Number },
    durationActual: { type: Number },
    checklist: { type: [String], default: [] },
    durationType: { type: Number, enum: [0, 1, 2, 3, 4, 5, 6], default: 3 },
    notifications: { type: String, enum: ["Y", "N"], default: "N" },
    pinned: { type: String, enum: ["Y", "N"], default: "N" },
    pinnedInGroup: { type: String, enum: ["Y", "N"], default: "N" },
    // comments: [
    //   {
    //     authorId: { type: mongoose.Schema.Types.ObjectId, ref: "UserLogin" },
    //     text: { type: String },
    //     createdAt: { type: Date, default: Date.now },
    //     updatedAt: { type: Date, default: Date.now },
    //     updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "UserLogin" },
        // cfile: {
        //  filename: { type: String},
        //  fileURL: { type: String },
        // },
    //   },
    // ],
    file: {
      filename: { type: String},
      fileURL: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

taskSchema.methods.generateFileURL = function () {
  console.log();
  if(this.file.filename){
    const fileURL = `http://support.itachyon.com/uploads/Task/${this.file.filename}`;
    this.file.fileURL = fileURL;
  }else{
    this.file.fileURL = ''
  }
};
taskSchema.pre('save', function (next) {
  if (this.file) {
    this.generateFileURL();
  }
  next();
});
const Task = mongoose.model("Task", taskSchema);

module.exports = Task;

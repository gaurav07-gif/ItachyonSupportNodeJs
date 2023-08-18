
const mongoose=require('mongoose');
const userSchema=new mongoose.Schema({
   
  projectId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project"  
   },
    clinicName:{
        type:String,
        default:""
    },
    block:{
        type:String,
        default:""
    },
    
    city:{
        type:String,
        default:""
    },
    zone:{
        type:String,
        default:""
    },
    clinicId:{
        type:String,
        default:""
    },
    address:{
        type:String,
        default:""
    },
    manager:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "userLogin"
    },
    createdBy:{ type: mongoose.Schema.Types.ObjectId,
        ref: "userLogin"},
    users:[{
        type: mongoose.Schema.Types.ObjectId,
      ref: "userLogin"
    }]
  
},
{timestamps: true}
)

const User=mongoose.model("clinic",userSchema);
module.exports=User;
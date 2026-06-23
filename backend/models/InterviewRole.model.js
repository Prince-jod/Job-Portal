import mongoose from "mongoose";

const interviewRoleSchema=new mongoose.Schema({
  roleName: {
    type:String,
    required: true,
    unique:true
  },
  image:{
    type:String,
    required: true
  },
  questionCount:{
    type:String,
    required:true
  },
  csvFileUrl:{
    type:String
  },
  CreatedBy:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true
  }
},{timeStamps:true});
export default mongoose.model("InterviewRole",interviewRoleSchema);
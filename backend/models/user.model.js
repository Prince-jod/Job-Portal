import mongoose from "mongoose";
const userSchema=new mongoose.Schema({

  name:{
    type:String,
    required:true
  },
  email: {
    type: String,
    unique: true,
    required:true
  },
  password:{
    type:String,
    required:true
  },
  phone:{
    type:String,
    default:" "
  },
  role:{
    type:String,
    enum:["user", "admin"],
    default:"user"
  },
  resume:{
    type:String,
    default:" "
  },
  resumePubliced:{
    type:String,
    default:""
  },
  savedJobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref:"job"
  }],
  savedInterviewQuestion: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "InterviewQurestion"
  }],
  savedRoleQuestion:[{
    type: mongoose.Schema.Types.ObjectId,
    ref: "RoleQuestion"
  }],
  isverified:{
    type:Boolean,
    default:false
  },
  verificationOTP: String,
  verificationExpires:Date,
  resetPasswordOTPExpires: Date,
  isVerified:{
  type:Boolean,
  default:false
},

verificationOTP: String,

verificationOTPExpires: Date,

resetPasswordOTP: String,

resetPasswordOTPExpires: Date,


},{timestamps: true});
export default mongoose.model("User",userSchema);
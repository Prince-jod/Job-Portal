import InterviewCompany from "../models/interviewCompany.model.js";
import InterviewQuestion from "../models/interviewQuestion.model.js";
import InterviewRole from "../models/interviewRole.model.js";
import RoleQuestion from "../models/roleQuestion.model.js";
import {uploadFiles} from "../utils/helpers.js";

//add to a company interview question
export const addInterviewComapany=async(req,res)=>{
  try{
    const { companyName, questionsCount,questionData}=req.body;
    if(!companyName || !questionsCount){
      return res.status(400).json({
message:"Required fields missing"
      })
    }
    const exists =await InterviewCompany.findOne({companyName});
    if(exists){
      return res.status(400).json({
        message: "Company already exists"
      });
    }
    const uploads=await uploadFiles
  }
  catch(error){

  }
}
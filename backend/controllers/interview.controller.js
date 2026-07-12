import InterviewCompany from "../models/interviewCompany.model.js";
import InterviewQuestion from "../models/interviewQuestion.model.js";
import InterviewRole from "../models/interviewRole.model.js";
import RoleQuestion from "../models/roleQuestion.model.js";
// import {uploadFiles} from "../utils/helpers.js";
import roleQuestionModel from "../models/roleQuestion.model.js";
import {handleError, parseQuestions, uploadFiles} from "../utils/helpers.js"
//interview Questions
//add to a company interview question
export const addInterviewCompany=async(req,res)=>{
  try{
    const { companyName, questionsCount,questionsData}=req.body;
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
    const uploads=await uploadFiles(req.files,{
       logoFile: { folder: "jobportal/logos", type: "image" },
            csvFile: { folder: "jobportal/csv", type: "raw" }
    });
    const company=await InterviewCompany.create({
      companyName,
      logo: uploads.logoFile ||"",
      questionsCount,
      csvFileUrl:uploads.csvFile ||"",
      createdBy:req.user.id
    });
    if(questionsData){
      const formatted=parseQuestions(
        questionData,
        "company",
        company._id,
        req.user.id
      );
      await InterviewQuestion.insertMany(formatted)

    }
    res.status(201).json({success:true,company});
  }
  catch(error){
handleError(res,error);
  }
};
export const getInterviewCompanies=async(req,res)=>{
  try{
    const companies=await InterviewCompany.find().sort({createdAt:-1});
    res.status(200).json({
      success:true,
      compaines
    });
  }
  catch(err){
    handleError(res,err);
  }
}
//now to get question for that company
export const  getInterviewQuestionByCompany=async(req,res)=>{
  try{
    const {companyId}=req.params;
    const [company,questions]=await Promise.all([
      InterviewCompany.findById(companyId),
      InterviewQuestion.find({company:companyId}).sort({createdAt:-1})
    ]);
    res.status(200).json({
      success:true,
      company,
      questions
    });
  }
  catch(error){
    handleError(res,error); 
  }
}
//update compnay
export const updateInterviewCompany = async (req, res) => {
    try {
        const { companyId } = req.params;
        const { companyName, questionsCount, questionsData } = req.body;

        const company = await InterviewCompany.findById(companyId);
        if (!company) {
            return res.status(404).json({ message: "Company not found" });
        }
//updated logo or csv file
        if (companyName) company.companyName = companyName;
        if (questionsCount) company.questionsCount = questionsCount;

        const uploads = await uploadFiles(req.files, {
            logFile: { folder: "jobportal/logos", type: "image" },
            csvFile: { folder: "jobportal/csv", type: "raw" }
        });

        if (uploads.logoFile) company.logo = uploads.logoFile;
        if (uploads.csvFile) company.csvFileUrl = uploads.csvFile;

        await company.save(); //updated data got saved
 
        if (questionsData) {
            const formatted = parseQuestions(
                questionsData,
                "company",
                company._id,
                req.user.id
            );

            await replaceQuestions(
                InterviewQuestion,
                { company: companyId },
                formatted //updated
            );
        }

        res.status(200).json({ success: true, company });

    } catch (err) {
        handleError(res, err);
    }
};
//delete a company
export const deleteInterviewCompany=async (req,res)=>{
  try{
    const {companyId}=req.params;
    await InterviewCompany.findByIdAndDelete(companyId);
    await InterviewQuestion.deleteMany({company:companyId});
    res.status(200).json({
      success:true,
      message:"company deleted successfully"
    })
  }
  catch(error){
    handleError(res,error);
  }
}
//role based question
//to add a role
export const addInterviewRole=async(req,res)=>{
  try{
    const {roleName,questionsCount,questionsData}=req.body;
    if(!roleName || !questionsCount){
      return res.status(400).json({
        message:"required fields missing"
      });
    }
    const exists =await InterviewRole.findOne({roleName});
    if(exists){
      return res.status(400).json({
        message:"role already exists"
      });
    }
    const uploads=await uploadFiles(
      req.files,{
        imageFile: { folder: "jobportal/roles", type: "image" },
            csvFile: { folder: "jobportal/csv", type: "raw" }
      })
      const role=await InterviewRole.create({
        roleName,
        image:upload.imageFile || "",
        questionsCount,
        csvFileUrl: upload.csvFile ||"",
        createdBy: req.user.id
      });
      if(questionsData){
        const formatted=parseQuestions(
          questionData,
          "role",
          role._id,
          req.user.id
        );
        await RoleQuestion.insertMany(formatted);
      }
      res.status(201).json({
        success:true,
        role
      });
    
    
  }
  catch(err){
    handleError(res,err);
  }
}
//to get the role
export const getInterviewRoles = async (req, res)=>{
  try {
    const roles = await InterviewRole.find().sort({createdAt: -1});
    res.status(200).json({
      success:true,
      roles
    });
  }

  catch(err) {
    handleError(res,err);

  }
}

//to fetch questions for roles

export const getQuestionsByRole = async(req,res)=>{
  try {
    const {roleId}=req.params;
    const [role, questions ] = await Promise.all([
      InterwievRole.findById(roleId),
      RoleQuestion.find({roleId}).sort({ceeatedAt:-1})
    ]);
    res.status(200).json({
      success: true,
      role,
      questions
    })
  }
catch(err){
  handleError(res,err);

}
}
//update Role
export const updateInterviewRole = async (req, res) => {
    try {
        const { roleId } = req.params;
        const { roleName, questionsCount, questionsData } = req.body;

        const role = await InterviewRole.findById(roleId);
        if (!role) {
            return res.status(404).json({ message: "Role not found" });
        }

        if (roleName) role.roleName = roleName;
        if (questionsCount) role.questionsCount = questionsCount;

        const uploads = await uploadFiles(req.files, {
            imageFile: { folder: "jobportal/roles", type: "image" },
            csvFile: { folder: "jobportal/csv", type: "raw" }
        });

        if (uploads.imageFile) role.image = uploads.imageFile;
        if (uploads.csvFile) role.csvFileUrl = uploads.csvFile;

        await role.save();

        if (questionsData) {
            const formatted = parseQuestions(
                questionsData,
                "role",
                role._id,
                req.user.id
            );

            await replaceQuestions(
                RoleQuestion,
                { roleId },
                formatted
            );
        }

        res.status(200).json({ success: true, role });

    } catch (err) {
        handleError(res, err);
    }
};
//delete a role
export const deleteInterviewRole=async(req,res)=>{
  try{
    const {roleId}=req.params;
    await InterviewRole.findByIdAndDelete(roleId);
    await RoleQuestion.deleteMany({roleId});
    res.status(200).json({
      success:true,
      message:"role deleted successfully"
    })
  }
  catch(err){
    handleError(res,err);
  }
}
 


import User from "../models/user.model.js";

// Toggle Save Job
export const toggleSaveJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isSaved = user.savedJobs.some(
      (id) => id.toString() === jobId
    );

    if (isSaved) {
      user.savedJobs = user.savedJobs.filter(
        (id) => id.toString() !== jobId
      );
    } else {
      user.savedJobs.push(jobId);
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: isSaved ? "Job unsaved" : "Job saved",
      savedJobs: user.savedJobs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Toggle Save Question
export const toggleSaveQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { type } = req.query;
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let isSaved = false;
    let message = "";

    if (type === "role") {
      isSaved = user.savedRoleQuestions.some(
        (id) => id.toString() === questionId
      );

      if (isSaved) {
        user.savedRoleQuestions = user.savedRoleQuestions.filter(
          (id) => id.toString() !== questionId
        );
        message = "Question unsaved";
      } else {
        user.savedRoleQuestions.push(questionId);
        message = "Question saved";
      }
    } else {
      isSaved = user.savedInterviewQuestions.some(
        (id) => id.toString() === questionId
      );

      if (isSaved) {
        user.savedInterviewQuestions =
          user.savedInterviewQuestions.filter(
            (id) => id.toString() !== questionId
          );

        message = "Question unsaved";
      } else {
        user.savedInterviewQuestions.push(questionId);
        message = "Question saved";
      }
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message,
      savedInterviewQuestions: user.savedInterviewQuestions,
      savedRoleQuestions: user.savedRoleQuestions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
//to get all saved jobs
export const getSavedItems=async(req,res)=>{
  try{
    const userId=req.user.id;
    const user=await User.findById(userId)
    .populate("savedJobs")
    .populate({
      path: "savedInterviewQuestions",
      populate: {path: "company"}
    })
    .populate({
      path: "savedRoleQuestions",
      populate: {path: "roleId"}
    });
    if(!user){
      return res.status(404).json({
        success: false,
        message: "user not found"
      });
    }
    res.status(200).json({
      success: true,
      savedJobs: user.savedJobs,
      savedInterviewQuestions:user.savedInterviewQuestions,
      savedRoleQuestion:user.savedRoleQuestions
    });
  }
  catch(error){
res.status(500).json({
  success:false,
  message: error.message
})
  }
}
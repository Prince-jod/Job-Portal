import { uploadToCloudinary } from "./cloudinaryUpload.js";

// Upload files to Cloudinary
export const uploadFiles = async (files, config) => {
  const result = {};

  if (!files) return result;

  for (const key in config) {
    if (files[key]) {
      const file = files[key][0];

      const uploadRes = await uploadToCloudinary(
        file.buffer,
        config[key].folder,
        config[key].type,
        file.originalname
      );

      result[key] = uploadRes.secure_url;
    }
  }

  return result;
};

// Parse and format questions
export const parseQuestions = (questionsData, type, id, userId) => {
  const parsed =
    typeof questionsData === "string"
      ? JSON.parse(questionsData)
      : questionsData;

  return parsed.map((q) => {
    let date = new Date(q.postDate);

    if (isNaN(date.getTime())) {
      date = new Date();
    }

    return {
      ...(type === "company" && { company: id }),
      ...(type === "role" && { roleId: id }),

      question: q.question,
      answer: q.answer,

      keyPoints: Array.isArray(q.keyPoints)
        ? q.keyPoints
        : q.keyPoints
        ? [q.keyPoints]
        : [],

      postDate: date,

      createdBy: userId,

      askedBy:
        q.companies?.map((c) => ({
          companyName: c.name || "",
          dateAsked: c.date || "",
        })) || [],
    };
  });
};

// Replace all questions
export const replaceQuestions = async (Model, filter, questions) => {
  await Model.deleteMany(filter);
  await Model.insertMany(questions);
};

// Common error handler
export const handleError = (res, error) => {
  console.error(error);

  return res.status(500).json({
    success: false,
    message: error.message || "Internal Server Error",
  });
};
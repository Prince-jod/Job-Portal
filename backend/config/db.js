import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    console.log("Connecting...");

    await mongoose.connect(
      "mongodb+srv://baghelprince164_db_user:Prince007%401234@cluster0.ecg9rus.mongodb.net/job?retryWrites=true&w=majority&appName=Cluster0/job"
    );

    console.log("Connected");
  } catch (err) {
    console.log("DB not Connected");
    console.log(err.message);
  }
};
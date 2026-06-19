import User from "../models/user.model.js";
import cloudinary from "../config/cloudinary.js";
import {uploadToCloudinary} from "../utils/cloudinaryUpload.js";
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password");
if(!user){
  return res.status(404).json({
    success: false,
    message: "User not found",
     });
  }
  res.status(200).json({
    success: true,
    user,
  });
  }

   
 catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}


export const updateProfile = async (req, res) => {
  try {
    const {name,email,phone}=req.body;
    const updateData={};
    if(name) updateData.name=name;
    if(email) updateData.email=email;
    if(phone) updateData.phone=phone;
  if(req.file && req.user.role === "user"){
    const originalName=req.file.originalname;
    const extension=originalName.split(".").pop().toLowerCase();
       // Sanitized filename but keep the extension for raw files
      const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
      const sanitizedBase = nameWithoutExt.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9\-_]/g, "");
      const sanitizedFileName = `${sanitizedBase}.${extension}`;

      // Determine resource type: images should be 'image', docs/pdfs often safer as 'raw' for delivery
      const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(extension);
      const resourceType = isImage ? "image" : "raw";
      const uploadResult = await uploadToCloudinary(req.file.buffer, "jobportal/resumes", resourceType, sanitizedFileName);
      if(uploadResult){
        updateData.resume=uploadResult.secure_url;
        updateData.resumePublicId=uploadResult.public_id;
      }

  }
  const user = await User.findByIdAndUpdate(req.user.id, updateData, {returnDocument: "after"}).select("-password");
  return res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user,
  });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getpublicIdFromUrl = (url, resourceType) => {
  try {
    const parts = url.split('/');

    const uploadIndex = parts.indexOf('upload');

    if (uploadIndex === -1 || uploadIndex + 1 >= parts.length) {
      return null;
    }

    const pathAfterVersion = parts.slice(uploadIndex + 2).join('/');

    if (resourceType === 'raw') {
      return pathAfterVersion;
    }

    return (
      pathAfterVersion.substring(
        0,
        pathAfterVersion.lastIndexOf('.')
      ) || pathAfterVersion
    );
  } catch (error) {
    console.error("Error extracting public_id from URL:", error);
    return null;
  }
};
//to get the user resume
export const getResume=async (req,res)=>{
  try{
    const user=await User.findById(req.params.id);
    if(!user || !user.resume){
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }
    const resourceType = user.resume.includes('/raw/') ? 'raw' : 'image';
    const publicId = user.resumePublicId || getpublicIdFromUrl(user.resume,resourceType);
    if(!publicId){
      return res.status(400).json({
        success: false,
        message: "Invalid resume URL",
      });
    }
    if(resourceType === 'raw'){
      const fileName = publicId.split('/').pop()||"resume.pdf";
      const format=fileName.includes(".") ? fileName.split(".").pop() : "pdf";
       const signedUrl = cloudinary.utils.private_download_url(publicId, format, {
        resource_type: "raw",
        type: "upload",
        secure: true,
        expires_at: Math.floor(Date.now() / 1000) + 300, // 5 minutes
      });
      return res.redirect(signedUrl);
  }
  //for images
  const signedUrl = cloudinary.url(publicId, {
      resource_type: "image",
      type: "upload",
      secure: true,
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + 300,
    });
    return res.redirect(signedUrl);
}
 catch(error){
  console.error("Error fetching resume:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

import Inquiry from "../models/inquiry.model.js";
import { sendAdminEnquiry } from "../utils/emailService.js";

// Submit Inquiry
export const submitInquiry = async (req, res) => {
  try {
    const { fullName, email, phone, subject, message } = req.body;

    if (!fullName || !email || !phone || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    const inquiry = await Inquiry.create({
      fullName,
      email,
      phone,
      subject,
      message,
    });

    // Send email to admin
    try {
      await sendAdminEnquiry({
        fullName,
        email,
        phone,
        subject,
        message,
      });
    } catch (emailError) {
      console.error(
        "Failed to send admin enquiry email:",
        emailError.message
      );
    }

    return res.status(201).json({
      success: true,
      message: "Inquiry submitted successfully.",
      inquiry,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
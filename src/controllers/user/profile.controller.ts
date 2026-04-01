// src/controllers/profile.controller.ts
import { Request, Response } from "express";
import User from "../../models/user.model";

export const updateProfile = async (req: any, res: Response) => {
  try {
    const userId = req.user?._id; // from auth middleware

    const {
      username,
      bio,
      avatar,
      isPrivate,
      notificationSettings,
      interests,
      location
    } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...(username && { username }),
        ...(bio && { bio }),
        ...(avatar && { profileImage: avatar }), // ✅ Mapped avatar to profileImage correctly
        ...(typeof isPrivate === "boolean" && { isPrivate }),
        ...(notificationSettings && { notificationSettings }),
        ...(interests && { interests }),
        ...(location && { location }),
      },
      { returnDocument: "after", runValidators: true } // 🔥 Fixed deprecation warning
    ).select("-password");

    return res.status(200).json({
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Profile update failed",
      error: error.message,
    });
  }
};
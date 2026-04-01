import { Request, Response } from "express";
import Chat from "../../models/chat.model";

export const accessChat = async (req: any, res: Response) => {
  const { userId } = req.body; // The ID of the friend you want to chat with
  const currentUserId = req.user._id;

  if (!userId) {
    return res.status(400).json({ message: "UserId param not sent with request" });
  }

  try {
    // 1. Try to find an existing 1-on-1 chat between these two users
    let isChat = await Chat.find({
      isGroup: false,
      $and: [
        { participants: { $elemMatch: { $eq: currentUserId } } },
        { participants: { $elemMatch: { $eq: userId } } },
      ],
    })
      .populate("participants", "username profilePicture email")
      .populate("lastMessage");

    // 2. If chat exists, return the first one found (there should only be one)
    if (isChat.length > 0) {
      return res.status(200).send(isChat[0]);
    } else {
      // 3. If no chat exists, create a new one
      const chatData = {
        groupName: "sender", // Default/Placeholder for 1-on-1
        isGroup: false,
        participants: [currentUserId, userId],
        unreadCounts: new Map([
          [currentUserId.toString(), 0],
          [userId.toString(), 0]
        ])
      };

      const createdChat = await Chat.create(chatData);
      
      // Populate the participants so the frontend has user info immediately
      const fullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "participants",
        "username profilePicture email"
      );

      return res.status(201).json(fullChat);
    }
  } catch (error) {
    return res.status(500).json({ 
      message: "Could not access the chat.", 
      error: error instanceof Error ? error.message : error 
    });
  }
};
export const getChats = async (req: any, res: Response) => {
  try {
    const currentUserId = req.user._id;

    // 1. Find all chats where the user is a participant
    const chats = await Chat.find({
      participants: { $elemMatch: { $eq: currentUserId } },
    })
      .populate("participants", "username profilePicture email status")
      .populate({
        path: "lastMessage",
        populate: {
          path: "senderId",
          select: "username profilePicture",
        },
      })
      .sort({ updatedAt: -1 }) // Show most recent conversations at the top
      .lean();

    return res.status(200).json({
      success: true,
      chats,
      count: chats.length,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch chat list.",
      error: error instanceof Error ? error.message : error,
    });
  }
};
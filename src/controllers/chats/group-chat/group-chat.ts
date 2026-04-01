import { Request, Response } from "express";
import mongoose from "mongoose";
import Message from "../../../models/message.model";
import Chat from "../../../models/chat.model";


export const groupSendMessage = async (req: any, res: any) => {
  try {
    const { chatId } = req.params;
    const { content, type } = req.body;

    // 🔍 1. Validate input
    if (!content) {
      return res.status(400).json({
        message: "Message content is required",
      });
    }

    // 🔍 2. Check chat exists
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        message: "Chat not found",
      });
    }

    // 🔒 3. Check if user is part of the group
    const isParticipant = chat.participants.some(
      (id: mongoose.Types.ObjectId) =>
        id.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        message: "You are not a member of this group",
      });
    }

    // 💬 4. Create message
    const message = await Message.create({
      chatId,
      senderId: req.user._id,
      content,
      type: type || "text",
      status: "sent",
      readBy: [req.user._id],
    });

    // 🔄 5. Update last message
    chat.lastMessage = message._id;
    await chat.save();

    // 📤 6. (Optional) Populate sender info
    const populatedMessage = await Message.findById(message._id)
      .populate("senderId", "username avatar");

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Send Message Error:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};
export const addUserToGroup = async (req: any, res: any) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.body;

    const chat = await Chat.findById(chatId);

    if (!chat || !chat.isGroup) {
      return res.status(400).json({ message: "Not a group chat or chat not found" });
    }

    // Check if user is already in the group
    const isAlreadyMember = chat.participants.some(
      (id: any) => id.toString() === userId.toString()
    );

    if (isAlreadyMember) {
      return res.status(400).json({ message: "User is already in the group" });
    }

    chat.participants.push(userId);
    await chat.save();

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
export const removeUserFromGroup = async (req: any, res: any) => {
  try {
    const { chatId, userId } = req.params;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    chat.participants = chat.participants.filter(
      (id: any) => id.toString() !== userId
    );

    await chat.save();

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
export const getUserChats = async (req: any, res: any) => {
  try {
    const chats = await Chat.find({
      participants: { $in: [req.userId] },
    }).populate("lastMessage");

    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const markMessagesAsRead = async (req: any, res: any) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    // 🔍 1. Check chat exists
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        message: "Chat not found",
      });
    }

    // 🔒 2. Check user is participant
    const isParticipant = chat.participants.some(
      (id: mongoose.Types.ObjectId) =>
        id.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    // 🔄 3. Update messages
    await Message.updateMany(
      {
        chatId,
        readBy: { $ne: userId }, // not already read
      },
      {
        $addToSet: { readBy: userId }, // avoid duplicates
        $set: { status: "read" },
      }
    );

    // 🔄 4. Reset unread count
    if (chat.unreadCounts) {
      chat.unreadCounts.set(userId.toString(), 0);
      await chat.save();
    }

    res.json({
      message: "Messages marked as read",
    });
  } catch (error) {
    console.error("Read Error:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};
export const getGroupMembers = async (req: any, res: any) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    // 🔍 1. Check chat exists
    const chat = await Chat.findById(chatId).populate(
      "participants",
      "uid username avatar bio"
    );

    if (!chat) {
      return res.status(404).json({
        message: "Chat not found",
      });
    }

    // 🔒 2. Check if user is part of group
    const isParticipant = chat.participants.some(
      (user: any) => user._id.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        message: "Not authorized to view members",
      });
    }

    // 📦 3. Return members
    res.json({
      members: chat.participants,
    });
  } catch (error) {
    console.error("Get Members Error:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};
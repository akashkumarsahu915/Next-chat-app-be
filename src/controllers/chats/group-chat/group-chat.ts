import { Request, Response } from "express";
import mongoose from "mongoose";
import Message from "../../../models/message.model";
import Chat from "../../../models/chat.model";
import { io } from "../../../index";
import { getReceiverSocketId } from "../../../socket/socket";


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

    // 🔄 5. Update last message and unread counts
    chat.lastMessage = message._id;

    // Increment unread counts for everyone except the sender
    chat.participants.forEach((participantId: any) => {
      const pIdStr = participantId.toString();
      if (pIdStr !== req.user._id.toString()) {
        const currentCount = chat.unreadCounts.get(pIdStr) || 0;
        chat.unreadCounts.set(pIdStr, currentCount + 1);
      }
    });

    await chat.save();

    // 📤 6. Populate sender info
    const populatedMessage = await Message.findById(message._id)
      .populate("senderId", "username profilePicture")
      .populate("chatId");

    // 🚀 Socket.io Emit: Broadcast to the entire group
    io.to(chatId).emit("new_message", populatedMessage);

    // 🚀 Socket.io Emit: Update Chat List for all participants
    const updatedChat = await Chat.findById(chatId)
      .populate("participants", "username profilePicture email status")
      .populate({
        path: "lastMessage",
        populate: {
          path: "senderId",
          select: "username profilePicture",
        },
      })
      .lean();

    if (updatedChat) {
      chat.participants.forEach((participantId: any) => {
        console.log(`🚀 [Chat Update Emission] update_chat to user ${participantId}`);
        io.to(participantId.toString()).emit("update_chat", updatedChat);
      });
    }

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

    // 🔄 4. Populate chat info for broadcasting
    const fullChat = await Chat.findById(chat._id)
      .populate("participants", "username profilePicture email")
      .lean();

    // 🚀 Socket.io Emit: Notify existing group members
    io.to(chatId).emit("user_added_to_group", { chatId, userId });

    // 🚀 Socket.io Emit: Notify the new user individual socket ID so the group appears
    const receiverSocketId = getReceiverSocketId(userId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("new_group", fullChat);
    }

    res.json(fullChat);
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

    // 🚀 Socket.io Emit: Notify group members that a user was removed
    io.to(chatId).emit("user_removed_from_group", { chatId, userId });

    // 🚀 Socket.io Emit: Notify the removed user specifically
    const receiverSocketId = getReceiverSocketId(userId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("group_removed", { chatId });
    }

    res.json({ message: "User removed successfully", chatId });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
export const getUserChats = async (req: any, res: any) => {
  try {
    const chats = await Chat.find({
      participants: { $in: [req.user._id] },
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

    // 🚀 Socket.io Emit: Update Chat List for all participants (to clear unread count)
    const updatedChat = await Chat.findById(chatId)
      .populate("participants", "username profilePicture email status")
      .populate({
        path: "lastMessage",
        populate: {
          path: "senderId",
          select: "username profilePicture",
        },
      })
      .lean();

    if (updatedChat) {
      chat.participants.forEach((participantId: any) => {
        console.log(`🚀 [Chat Update Emission] update_chat to user ${participantId}`);
        io.to(participantId.toString()).emit("update_chat", updatedChat);
      });
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
      "uid username profilePicture bio"
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
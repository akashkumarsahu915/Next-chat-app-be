import { Request, Response } from "express";
import mongoose from "mongoose";
import Message from "../../models/message.model";
import Chat from "../../models/chat.model";
import { io } from "../../index";
import { getReceiverSocketId } from "../../socket/socket";
export const sendMessage = async (req: any, res: Response) => {
  const { chatId, content, type } = req.body;
  const senderId = req.user._id;

  if (!chatId || !content) {
    return res.status(400).json({ message: "Chat ID and content are required." });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Create the message document
    const [newMessage] = await Message.create([{
      chatId,
      senderId,
      content,
      type: type || "text",
      status: "sent",
      readBy: [senderId] // Sender has read their own message
    }], { session });
    // 2. Update the Chat document: set lastMessage and increment unread counts
    const chat = await Chat.findById(chatId).session(session);
    if (!chat) {
      throw new Error("Chat not found");
    }

    chat.lastMessage = newMessage._id;

    // Increment unread counts for everyone except the sender
    chat.participants.forEach((participantId) => {
      const pIdStr = participantId.toString();
      if (pIdStr !== senderId.toString()) {
        const currentCount = chat.unreadCounts.get(pIdStr) || 0;
        chat.unreadCounts.set(pIdStr, currentCount + 1);
      }
    });

    await chat.save({ session });
    await session.commitTransaction();

    // 3. Populate sender info for the frontend UI
    const fullMessage = await Message.findById(newMessage._id)
      .populate("senderId", "username profilePicture")
      .lean();

    // 🚀 Socket.io Emit: Notify all participants in the chat room
    if (fullMessage) {
      const room = chatId.toString();
      const socketCount = io.sockets.adapter.rooms.get(room)?.size || 0;
      console.log(`🚀 [Room Emission] new_message to ${room} (👥 Sockets in room: ${socketCount})`);
      
      // 1. Room Emission (Primary)
      io.to(room).emit("new_message", fullMessage);

      // 3. Update Chat List Emission (Ensures Sidebar updates in real-time)
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
        chat.participants.forEach((participantId) => {
          console.log(`🚀 [Chat Update Emission] update_chat to user ${participantId}`);
          io.to(participantId.toString()).emit("update_chat", updatedChat);
        });
      }
    }

    return res.status(201).json(fullMessage);
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({ 
        message: "Message could not be sent.", 
        error: error instanceof Error ? error.message : error 
    });
  } finally {
    session.endSession();
  }
};
export const getMessages = async (req: any, res: Response) => {
  const { chatId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  try {
    const messages = await Message.find({ chatId })
      .populate("senderId", "username profilePicture")
      .sort({ createdAt: -1 }) // Get newest first for pagination
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Reverse to show oldest -> newest (standard chat UI flow)
    return res.status(200).json({
      success: true,
      messages: messages.reverse(),
      page,
      limit
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching messages.", error });
  }
};
export const markAsRead = async (req: any, res: Response) => {
  const { chatId } = req.params;
  const currentUserId = req.user._id;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Reset unread count for the current user in this chat
    const chat = await Chat.findById(chatId).session(session);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Update the Map: Set current user's count to 0
    chat.unreadCounts.set(currentUserId.toString(), 0);
    await chat.save({ session });

    // 2. Update all pending messages in this chat to 'read'
    // Logic: Update messages where (chatId matches) AND (sender is NOT me) AND (I am not in readBy)
    await Message.updateMany(
      {
        chatId: chatId,
        senderId: { $ne: currentUserId },
        readBy: { $ne: currentUserId }
      },
      {
        $set: { status: "read" },
        $addToSet: { readBy: currentUserId }
      },
      { session }
    );

    await session.commitTransaction();

    // 🚀 Socket.io Emit: Notify everyone in the chat room that messages have been read
    const room = chatId.toString();
    const socketCount = io.sockets.adapter.rooms.get(room)?.size || 0;
    console.log(`🚀 [Room Emission] messages_read to ${room} (👥 Sockets in room: ${socketCount})`);
    
    const readPayload = { chatId, userId: currentUserId };

    // 1. Room Emission
    io.to(room).emit("messages_read", readPayload);

    // 2. Direct User Fallback
    chat.participants.forEach((participantId) => {
      console.log(`🚀 [Direct Emission] messages_read to user ${participantId}`);
      io.to(participantId.toString()).emit("messages_read", readPayload);
    });

    // 3. Update Chat List Emission (Clear unread counts in sidebar)
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
      chat.participants.forEach((participantId) => {
        console.log(`🚀 [Chat Update Emission] update_chat to user ${participantId}`);
        io.to(participantId.toString()).emit("update_chat", updatedChat);
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: "Messages marked as read." 
    });

  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({ 
        message: "Failed to mark messages as read.", 
        error: error instanceof Error ? error.message : error 
    });
  } finally {
    session.endSession();
  }
};
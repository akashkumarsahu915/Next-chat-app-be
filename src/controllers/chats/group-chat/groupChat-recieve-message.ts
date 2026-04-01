import { Request, Response } from "express";
import mongoose from "mongoose";
import Message from "../../../models/message.model";
import Chat from "../../../models/chat.model";


export const groupGetMessages = async (req: any, res: any) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    // Check if the chat exists and if the user is a participant
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const isParticipant = chat.participants.some(
      (id: any) => id.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: "Not a member of this group" });
    }

    const messages = await Message.find({ chatId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

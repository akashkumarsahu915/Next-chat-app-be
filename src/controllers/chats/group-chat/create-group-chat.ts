import { Response } from "express";
import Chat from "../../../models/chat.model";

export const createGroup = async (req: any, res: Response) => {
    try {
        const { groupName, participants } = req.body;

        if (!groupName || !participants || participants.length < 2) {
            return res.status(400).json({
                message: "Group must have name and at least 2 users",
            });
        }

        const currentUserId = req.user._id;

        // Ensure unique participants and include the creator
        const uniqueParticipantIds = Array.from(new Set([
            currentUserId.toString(),
            ...participants.map((id: any) => id.toString())
        ]));

        const chat = await Chat.create({
            isGroup: true,
            groupName,
            participants: uniqueParticipantIds,
            unreadCounts: new Map(
                uniqueParticipantIds.map((id: string) => [id, 0])
            )
        });

        res.status(201).json(chat);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : error });
    }
};
import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
    chatId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    content: string;
    type: "text" | "image" | "file";
    status: "sent" | "delivered" | "read";
    readBy: mongoose.Types.ObjectId[];
}

const messageSchema = new Schema<IMessage>(
    {
        chatId: {
            type: Schema.Types.ObjectId,
            ref: "Chat",
            required: true,
        },

        senderId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        content: { type: String, required: true },

        type: {
            type: String,
            enum: ["text", "image", "file"],
            default: "text",
        },

        status: {
            type: String,
            enum: ["sent", "delivered", "read"],
            default: "sent",
        },

        readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    },
    { timestamps: true }
);

// Important index for chat performance
messageSchema.index({ chatId: 1, createdAt: -1 });

export default mongoose.model<IMessage>("Message", messageSchema);
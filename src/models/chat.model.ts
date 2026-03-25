import mongoose, { Schema, Document } from "mongoose";

export interface IChat extends Document {
    isGroup: boolean;
    groupName?: string;
    groupAvatar?: string;
    participants: mongoose.Types.ObjectId[];
    lastMessage?: mongoose.Types.ObjectId;
    unreadCounts: Map<string, number>;
}

const chatSchema = new Schema<IChat>(
    {
        isGroup: { type: Boolean, default: false },

        groupName: { type: String },
        groupAvatar: { type: String },

        participants: [
            { type: Schema.Types.ObjectId, ref: "User", required: true },
        ],

        lastMessage: { type: Schema.Types.ObjectId, ref: "Message" },

        unreadCounts: {
            type: Map,
            of: Number,
            default: {},
        },
    },
    { timestamps: true }
);

// Index for fast lookup
chatSchema.index({ participants: 1 });

export default mongoose.model<IChat>("Chat", chatSchema);
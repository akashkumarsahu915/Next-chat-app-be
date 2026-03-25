import mongoose, { Schema, Document } from "mongoose";

export interface IFriendRequest extends Document {
    from: mongoose.Types.ObjectId;
    to: mongoose.Types.ObjectId;
    status: "pending" | "accepted" | "rejected";
}

const friendRequestSchema = new Schema<IFriendRequest>(
    {
        from: { type: Schema.Types.ObjectId, ref: "User", required: true },
        to: { type: Schema.Types.ObjectId, ref: "User", required: true },

        status: {
            type: String,
            enum: ["pending", "accepted", "rejected"],
            default: "pending",
        },
    },
    { timestamps: true }
);

// Prevent duplicate requests
friendRequestSchema.index({ from: 1, to: 1 }, { unique: true });

export default mongoose.model<IFriendRequest>(
    "FriendRequest",
    friendRequestSchema
);
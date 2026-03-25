import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
    uid: string;
    username: string;
    email: string;
    password: string;
    bio?: string;
    avatar?: string;
    interests?: string[];
    isPrivate: boolean;
    isOnline: boolean;
    lastSeen?: Date;
    friends: mongoose.Types.ObjectId[];
    blockedUsers: mongoose.Types.ObjectId[];
    notificationSettings: {
        pushEnabled: boolean;
        newMessages: boolean;
        friendRequests: boolean;
        systemAlerts: boolean;
    };
}

const userSchema = new Schema<IUser>(
    {
        uid: { type: String, unique: true, required: true },
        username: { type: String, unique: true, required: true },
        email: { type: String, unique: true, required: true },
        password: { type: String, required: true },

        bio: { type: String, default: "" },
        avatar: { type: String, default: "" },
        interests: [{ type: String }],

        isPrivate: { type: Boolean, default: false },
        isOnline: { type: Boolean, default: false },
        lastSeen: { type: Date },

        friends: [{ type: Schema.Types.ObjectId, ref: "User" }],
        blockedUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],

        notificationSettings: {
            pushEnabled: { type: Boolean, default: true },
            newMessages: { type: Boolean, default: true },
            friendRequests: { type: Boolean, default: true },
            systemAlerts: { type: Boolean, default: false },
        },
    },
    { timestamps: true }
);

// Password hashing middleware
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (error: any) {
        throw error;
    }
});

// Indexes (important)
// userSchema.index({ username: 1 });
// userSchema.index({ email: 1 });
// userSchema.index({ uid: 1 });

export default mongoose.model<IUser>("User", userSchema);
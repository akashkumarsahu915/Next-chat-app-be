import { Request, Response } from "express";
import User from "../../models/user.model";
import mongoose from "mongoose";

export const searchUsers = async (req: any, res: Response) => {
    try {
        const { search } = req.query;

        if (!search) {
            return res.status(400).json({
                message: "Search query is required",
            });
        }

        const users = await User.find({
            $and: [
                {
                    $or: [
                        { username: { $regex: search, $options: "i" } },
                        { uid: { $regex: search, $options: "i" } },
                    ],
                },
                {
                    _id: { $ne: req.user._id }, // exclude current user
                },
            ],
        })
            .select("uid username avatar bio isPrivate")
            .limit(10);

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
export const locateUsers = async (req: any, res: Response) => {
    try {
        const currentUser = await User.findById(req.user._id);

        if (!currentUser) {
            return res.status(404).json({ message: "User not found" });
        }

        const users = await User.find({
            location: { $in: currentUser.location },
            _id: {
                $ne: currentUser._id,
                $nin: [
                    ...((currentUser.friends as unknown as mongoose.Types.ObjectId[]) || []),
                    ...((currentUser.blockedUsers as unknown as mongoose.Types.ObjectId[]) || []),
                ],
            },
            isPrivate: false,
        })
            .select("uid username avatar bio location isPrivate")
            .limit(10);

        return res.json(users);
    } catch (error) {
        res.status(500).json({
            message: "Server error",
        });
    }
};
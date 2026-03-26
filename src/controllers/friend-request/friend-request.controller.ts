import { Request, Response } from "express";
import User from "../../models/user.model";
import FriendRequest from "../../models/friendRequest.model";
import mongoose from "mongoose";

export const sendFriendRequest = async (req: any, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const senderId = req.user._id; // Assuming auth middleware attaches user
    const { receiverId } = req.body;

    // 1. Basic Validation
    if (senderId.toString() === receiverId) {
      return res.status(400).json({ message: "You cannot send a request to yourself." });
    }

    const [sender, receiver] = await Promise.all([
      User.findById(senderId),
      User.findById(receiverId)
    ]);

    if (!sender || !receiver) {
      return res.status(404).json({ message: "User not found." });
    }

    // 2. Check if already friends
    if (sender.friends.includes(receiverId)) {
      return res.status(400).json({ message: "You are already friends." });
    }

    // 3. Check if blocked (either direction)
    if (sender.blockedUsers.includes(receiverId) || receiver.blockedUsers.includes(senderId)) {
      return res.status(403).json({ message: "Action restricted by due toprivacy settings." });
    }

    // 4. Check for existing requests (Pending or Rejected)
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { from: senderId, to: receiverId },
        { from: receiverId, to: senderId }
      ]
    });

    if (existingRequest) {
      if (existingRequest.status === "pending") {
        return res.status(400).json({ message: "Request already pending." });
      }

      if (existingRequest.status === "accepted") {
        return res.status(400).json({ message: "You are already friends." });
      }

      // If previously rejected, we allow a "resend" by updating status to pending
      if (existingRequest.status === "rejected") {
        existingRequest.status = "pending";
        existingRequest.from = senderId; // Update in case the "rejecter" is now sending
        existingRequest.to = receiverId;
        await existingRequest.save({ session });
      }
    } else {
      // 5. Create new request
      await FriendRequest.create([{ from: senderId, to: receiverId }], { session });
    }

    await session.commitTransaction();

    // TODO: Emit Socket.IO event here: io.to(receiverId).emit("friend_request_received")

    return res.status(201).json({ message: "Friend request sent successfully." });

  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({ message: "Internal server error.", error });
  } finally {
    session.endSession();
  }
};


export const respondToFriendRequest = async (req: any, res: Response) => {
  const { requestId } = req.params;
  const { action } = req.body;
  const currentUserId = req.user._id; // From your auth middleware

  if (!["accepted", "rejected"].includes(action)) {
    return res.status(400).json({ message: "Invalid action. Use 'accepted' or 'rejected'." });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Find the request
    const friendRequest = await FriendRequest.findById(requestId).session(session);

    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found." });
    }

    // 2. Validate: Only the recipient ('to') can accept/reject
    if (friendRequest.to.toString() !== currentUserId.toString()) {
      return res.status(403).json({ message: "You are not authorized to respond to this request." });
    }

    // 3. Ensure the request is still pending
    if (friendRequest.status !== "pending") {
      return res.status(400).json({ message: `This request has already been ${friendRequest.status}.` });
    }

    if (action === "accepted") {
      // 4. Update Request Status
      friendRequest.status = "accepted";
      await friendRequest.save({ session });

      // 5. Update both users' friend lists
      // We use $addToSet to prevent any accidental duplicate IDs in the array
      await User.findByIdAndUpdate(
        friendRequest.from,
        { $addToSet: { friends: friendRequest.to } },
        { session }
      );

      await User.findByIdAndUpdate(
        friendRequest.to,
        { $addToSet: { friends: friendRequest.from } },
        { session }
      );

      await session.commitTransaction();

      // TODO: Emit Socket event: io.to(friendRequest.from.toString()).emit("friend_request_accepted", { by: currentUserId })

      return res.status(200).json({ message: "Friend request accepted." });
    }

    if (action === "rejected") {
      // 6. Simply update status to rejected
      friendRequest.status = "rejected";
      await friendRequest.save({ session });

      await session.commitTransaction();
      return res.status(200).json({ message: "Friend request rejected." });
    }

  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({ message: "Internal server error.", error });
  } finally {
    session.endSession();
  }
};


export const getFriendRequests = async (req: any, res: Response) => {
  try {
    const currentUserId = req.user._id;

    // Fetch both types in parallel for better performance
    const [incoming, outgoing] = await Promise.all([
      // 1. Incoming: Sent TO me, status is pending
      FriendRequest.find({
        to: currentUserId,
        status: "pending"
      })
        .populate("from", "username profilePicture") // Adjust fields based on your User model
        .sort({ createdAt: -1 }),

      // 2. Outgoing: Sent BY me, status is pending
      FriendRequest.find({
        from: currentUserId,
        status: "pending"
      })
        .populate("to", "username profilePicture")
        .sort({ createdAt: -1 })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        incoming,
        outgoing,
        count: {
          incoming: incoming.length,
          outgoing: outgoing.length
        }
      }
    });

  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch friend requests.",
      error: error instanceof Error ? error.message : error
    });
  }
};

export const getFriendList = async (req: any, res: Response) => {
  try {
    const currentUserId = req.user._id;

    // 1. Find user and populate the 'friends' array
    // We only select necessary fields to keep the payload light
    const userWithFriends = await User.findById(currentUserId)
      .populate({
        path: "friends",
        select: "username profilePicture email status", // Adjust fields as needed
      })
      .lean(); // Use .lean() for faster, read-only performance

    if (!userWithFriends) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
      success: true,
      friends: userWithFriends.friends,
      count: userWithFriends.friends.length
    });

  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch friend list.",
      error: error instanceof Error ? error.message : error
    });
  }
};

export const removeFriend = async (req: any, res: Response) => {
  const { friendId } = req.params;
  const currentUserId = req.user._id;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Remove from both users' friend arrays
    // $pull removes the specific ID from the array if it exists
    const userUpdate = await User.findByIdAndUpdate(
      currentUserId,
      { $pull: { friends: friendId } },
      { session, new: true }
    );

    const friendUpdate = await User.findByIdAndUpdate(
      friendId,
      { $pull: { friends: currentUserId } },
      { session, new: true }
    );

    if (!userUpdate || !friendUpdate) {
      throw new Error("One or both users not found.");
    }

    // 2. Cleanup: Update the FriendRequest status to "rejected" or delete it
    // Keeping it as "rejected" allows them to send a request again in the future
    await FriendRequest.findOneAndUpdate(
      {
        $or: [
          { from: currentUserId, to: friendId },
          { from: friendId, to: currentUserId }
        ],
        status: "accepted"
      },
      { status: "rejected" },
      { session }
    );

    await session.commitTransaction();

    // TODO: Emit Socket event: io.to(friendId).emit("friend_removed", { by: currentUserId })

    return res.status(200).json({
      success: true,
      message: "Friend removed successfully."
    });

  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({
      message: "Failed to remove friend.",
      error: error instanceof Error ? error.message : error
    });
  } finally {
    session.endSession();
  }
};

export const blockUser = async (req: any, res: Response) => {
  const { userId: targetUserId } = req.params;
  const currentUserId = req.user._id;

  if (currentUserId.toString() === targetUserId) {
    return res.status(400).json({ message: "You cannot block yourself." });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Add targetUserId to current user's blockedUsers and REMOVE from friends
    await User.findByIdAndUpdate(
      currentUserId,
      {
        $addToSet: { blockedUsers: targetUserId },
        $pull: { friends: targetUserId }
      },
      { session }
    );

    // 2. Remove currentUserId from target user's friends list
    await User.findByIdAndUpdate(
      targetUserId,
      { $pull: { friends: currentUserId } },
      { session }
    );

    // 3. Delete or Update any existing FriendRequests between them
    // We "hard delete" or set to a "blocked" state to prevent resending
    await FriendRequest.deleteMany(
      {
        $or: [
          { from: currentUserId, to: targetUserId },
          { from: targetUserId, to: currentUserId }
        ]
      },
      { session }
    );

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "User has been blocked successfully."
    });

  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({
      message: "Failed to block user.",
      error: error instanceof Error ? error.message : error
    });
  } finally {
    session.endSession();
  }
};

export const unblockUser = async (req: any, res: Response) => {
  const { userId: targetUserId } = req.params;
  const currentUserId = req.user._id;

  try {
    // 1. Remove the targetUserId from the current user's blockedUsers array
    // $pull handles the removal efficiently
    const updatedUser = await User.findByIdAndUpdate(
      currentUserId,
      { $pull: { blockedUsers: targetUserId } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
      success: true,
      message: "User unblocked successfully. You can now interact with them again."
    });

  } catch (error) {
    return res.status(500).json({ 
      message: "Failed to unblock user.", 
      error: error instanceof Error ? error.message : error 
    });
  }
};
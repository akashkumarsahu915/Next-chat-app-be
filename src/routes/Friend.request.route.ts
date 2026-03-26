import { Router } from "express";
import { blockUser, getFriendList, getFriendRequests, removeFriend, respondToFriendRequest, sendFriendRequest, unblockUser } from "../controllers/friend-request/friend-request.controller";
import { AuthenticateUser } from "../middleware/auth.middleware";
const router = Router();
router.use(AuthenticateUser);

/**
 * @swagger
 * tags:
 *   name: Friend Request
 *   description: API for managing friend requests
 */

/**
 * @swagger
 * /friend-request/send-request:
 *   post:
 *     summary: Send a friend request
 *     tags: [Friend Request]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiverId
 *             properties:
 *               receiverId:
 *                 type: string
 *                 example: "65f1234567890abcdef12345"
 *     responses:
 *       201:
 *         description: Friend request sent successfully
 *       400:
 *         description: Bad Request (Self-request, already friends, or pending request)
 *       403:
 *         description: Forbidden (Blocked by privacy settings)
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post("/send-request", sendFriendRequest);

/**
 * @swagger
 * /friend-request/respond/{requestId}:
 *   post:
 *     summary: Respond to a friend request (Accept or Reject)
 *     tags: [Friend Request]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the friend request
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [accepted, rejected]
 *                 example: "accepted"
 *     responses:
 *       200:
 *         description: Successfully responded to friend request
 *       400:
 *         description: Invalid action or request already processed
 *       403:
 *         description: Not authorized to respond to this request
 *       404:
 *         description: Friend request not found
 *       500:
 *         description: Internal server error
 */
router.post("/respond/:requestId", respondToFriendRequest);

/**
 * @swagger
 * /friend-request/request-status:
 *   get:
 *     summary: Get pending incoming and outgoing friend requests
 *     tags: [Friend Request]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched friend requests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     incoming:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           from:
 *                             type: object
 *                             properties:
 *                               username:
 *                                 type: string
 *                               profilePicture:
 *                                 type: string
 *                           status:
 *                             type: string
 *                             example: "pending"
 *                     outgoing:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           to:
 *                             type: object
 *                             properties:
 *                               username:
 *                                 type: string
 *                               profilePicture:
 *                                 type: string
 *                           status:
 *                             type: string
 *                             example: "pending"
 *                     count:
 *                       type: object
 *                       properties:
 *                         incoming:
 *                           type: integer
 *                         outgoing:
 *                           type: integer
 *       500:
 *         description: Failed to fetch friend requests
 */
router.get("/request-status", getFriendRequests);


/**
 * @swagger
 * /friend-request/friend-list:
 *   get:
 *     summary: Get the user's friend list
 *     tags: [Friend Request]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched friend list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 friends:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       username:
 *                         type: string
 *                       profilePicture:
 *                         type: string
 *                       email:
 *                         type: string
 *                       status:
 *                         type: string
 *                         example: "online"
 *                 count:
 *                   type: integer
 *                   example: 5
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to fetch friend list
 */
router.get("/friend-list", getFriendList);


/**
 * @swagger
 * /friend-request/remove-friend/{friendId}:
 *   delete:
 *     summary: Remove a friend
 *     tags: [Friend Request]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the friend to remove
 *     responses:
 *       200:
 *         description: Successfully removed friend
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Friend removed successfully."
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to remove friend
 */
router.delete("/remove-friend/:friendId", removeFriend);


/**
 * @swagger
 * /friend-request/block/{userId}:
 *   post:
 *     summary: Block a user
 *     tags: [Friend Request]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to block
 *     responses:
 *       200:
 *         description: User blocked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User has been blocked successfully."
 *       400:
 *         description: Bad Request (Cannot block self)
 *       500:
 *         description: Failed to block user
 */
router.post("/block/:userId", blockUser);


/**
 * @swagger
 * /friend-request/unblock/{userId}:
 *   post:
 *     summary: Unblock a user
 *     tags: [Friend Request]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to unblock
 *     responses:
 *       200:
 *         description: User unblocked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User unblocked successfully. You can now interact with them again."
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to unblock user
 */
router.post("/unblock/:userId", unblockUser);
export default router;

import { Router } from "express";
import { AuthenticateUser } from "../middleware/auth.middleware";

import {
  groupSendMessage,
  addUserToGroup,
  removeUserFromGroup,
  getUserChats,
  markMessagesAsRead,
  getGroupMembers,
} from "../controllers/chats/group-chat/group-chat";
import { createGroup } from "../controllers/chats/group-chat/create-group-chat";
import { groupGetMessages } from "../controllers/chats/group-chat/groupChat-recieve-message";
const router = Router();

/**
 * @swagger
 * /api/chats/group:
 *   post:
 *     summary: Create a group chat
 *     description: Creates a new group chat with a name and at least 2 participants.
 *     tags: [groupChat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - groupName
 *               - participants
 *             properties:
 *               groupName:
 *                 type: string
 *                 example: "Project Team"
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 2
 *                 description: Array of user IDs (ObjectIds) to be added to the group.
 *                 example: ["67da9d80d28795da3654497e", "67da9d8dd28795da36544a4e"]
 *     responses:
 *       201:
 *         description: Group chat created successfully.
 *       400:
 *         description: Bad Request (e.g., missing name or less than 2 participants).
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server Error.
 */

router.post("/group", AuthenticateUser, createGroup);

/**
 * @swagger
 * /api/chats/{chatId}/message:
 *   post:
 *     summary: Send message in group
 *     description: Sends a new message to a specific group chat.
 *     tags: [groupChat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the group chat.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: "Hello Team!"
 *               type:
 *                 type: string
 *                 enum: [text, image, file]
 *                 default: text
 *     responses:
 *       201:
 *         description: Message sent successfully.
 *       400:
 *         description: Bad Request (e.g., missing content).
 *       403:
 *         description: Forbidden (user not in group).
 *       404:
 *         description: Chat not found.
 *       500:
 *         description: Server Error.
 */
router.post("/:chatId/message", AuthenticateUser, groupSendMessage);

/**
 * @swagger
 * /api/chats/{chatId}/messages:
 *   get:
 *     summary: Get messages of a chat
 *     description: Retrieves the last 50 messages for a specific group chat.
 *     tags: [groupChat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the group chat.
 *     responses:
 *       200:
 *         description: Successfully retrieved messages.
 *       500:
 *         description: Server Error.
 */
router.get("/:chatId/messages", AuthenticateUser, groupGetMessages);

/**
 * @swagger
 * /api/chats/{chatId}/add-user:
 *   post:
 *     summary: Add user to group
 *     description: Adds a specified user to a group chat. Only works for group chats.
 *     tags: [groupChat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the group chat.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "67da9d80d28795da3654497e"
 *     responses:
 *       200:
 *         description: User added successfully.
 *       400:
 *         description: Not a group chat or other client error.
 *       500:
 *         description: Server Error.
 */
router.post("/:chatId/add-user", AuthenticateUser, addUserToGroup);

/**
 * @swagger
 * /api/chats/{chatId}/remove-user/{userId}:
 *   delete:
 *     summary: Remove user from group
 *     description: Removes a specific user from a group chat.
 *     tags: [groupChat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the group chat.
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to remove.
 *     responses:
 *       200:
 *         description: User removed successfully.
 *       404:
 *         description: Chat not found.
 *       500:
 *         description: Server Error.
 */
router.delete(
  "/:chatId/remove-user/:userId",
  AuthenticateUser,
  removeUserFromGroup,
);



/**
 * @swagger
 * /api/chats/{chatId}/read:
 *   post:
 *     summary: Mark messages as read
 *     description: Marks all messages in a specific group chat as read for the authenticated user.
 *     tags: [groupChat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the group chat.
 *     responses:
 *       200:
 *         description: Messages marked as read successfully.
 *       403:
 *         description: Forbidden (not a participant).
 *       404:
 *         description: Chat not found.
 *       500:
 *         description: Server Error.
 */
router.post("/:chatId/read", AuthenticateUser, markMessagesAsRead);
/**
 * @swagger
 * /api/chats/{chatId}/members:
 *   get:
 *     summary: Get all members of a group chat
 *     tags: [groupChat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of group members
 */
router.get("/:chatId/members", AuthenticateUser, getGroupMembers);
export default router;

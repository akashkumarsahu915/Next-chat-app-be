import { Router } from "express";
import { accessChat, getChats } from "../controllers/chats/user.chat";
import { AuthenticateUser } from "../middleware/auth.middleware";
import { sendMessage } from "../controllers/chats/user.message";
import { getMessages } from "../controllers/chats/user.message";
import { markAsRead } from "../controllers/chats/user.message";

const router = Router();

/**
 * @swagger
 * /api/chats:
 *   post:
 *     summary: Access or Create a 1-on-1 chat
 *     description: Checks if a 1-on-1 chat exists with the target user. If yes, returns it; if no, creates a new one.
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
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
 *                 description: The ID of the friend to chat with
 *                 example: "65f1a..."
 *     responses:
 *       201:
 *         description: Chat accessed or created successfully
 *       400:
 *         description: Missing userId
 *       500:
 *         description: Server Error
 *
 *   get:
 *     summary: Get all chats for the current user
 *     description: Returns a list of all conversations (1-on-1 and Group) the user is participating in.
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved chat list
 *       401:
 *         description: Unauthorized
 */
router.post("/chats", AuthenticateUser, accessChat);
router.get("/chats", AuthenticateUser, getChats);
/**
 * @swagger
 * /api/message:
 *   post:
 *     summary: Send a new message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [chatId, content]
 *             properties:
 *               chatId:
 *                 type: string
 *                 example: "65f1a..."
 *               content:
 *                 type: string
 *                 example: "Hello, how are you?"
 *               type:
 *                 type: string
 *                 enum: [text, image, file]
 *                 default: text
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post("/message", AuthenticateUser, sendMessage);

/**
 * @swagger
 * /api/message/{chatId}:
 *   get:
 *     summary: Get message history for a chat
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the chat room
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of messages per page
 *     responses:
 *       200:
 *         description: Array of messages returned successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Chat not found
 */
router.get("/message/:chatId", AuthenticateUser, getMessages);
/**
 * @swagger
 * /api/messages/read/{chatId}:
 *   patch:
 *     summary: Mark all messages in a chat as read
 *     description: Resets the unread count for the user and updates message status to 'read'.
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the chat to mark as read
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       404:
 *         description: Chat not found
 *       500:
 *         description: Server Error
 */
router.patch("/messages/read/:chatId", AuthenticateUser, markAsRead);

export default router;

import express from "express";
import { register, login } from "../controllers/auth/auth.controller";
import { getMe } from "../controllers/auth/auth.controller";
import { AuthenticateUser } from "../middleware/auth.middleware"
const router = express.Router();
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: akash
 *               email:
 *                 type: string
 *                 example: akash@gmail.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post("/register", register);
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: akash@gmail.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post("/login", login);
/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current logged-in user
 *     description: Returns basic profile details of the authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched user data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uid:
 *                   type: string
 *                   example: "123456"
 *                 username:
 *                   type: string
 *                   example: "akash"
 *                 profilePicture:
 *                   type: string
 *                   example: "https://example.com/avatar.png"
 *                 interests:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["coding", "music"]
 *                 bio:
 *                   type: string
 *                   example: "Hey I am Akash"
 *       401:
 *         description: Unauthorized (No token or invalid token)
 *       404:
 *         description: User not found
 */
router.get("/me", AuthenticateUser, getMe);
export default router;
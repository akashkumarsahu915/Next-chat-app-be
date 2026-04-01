import { Router } from "express";
import { searchUsers, locateUsers } from "../controllers/user/user.controller";
import { AuthenticateUser } from "../middleware/auth.middleware";
import { updateProfile } from "../controllers/user/profile.controller";
const router = Router();

/**
 * @swagger
 * /user/search:
 *   get:
 *     summary: Search users
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of users
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.get("/search", AuthenticateUser, searchUsers);

/**
 * @swagger
 * /user/locate-users:
 *   get:
 *     summary: Get users based on location
 *     description: Suggest users from the same location
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: location
 *         required: true
 *         schema:
 *           type: string
 *         example: balasore
 *     responses:
 *       200:
 *         description: List of users from same location
 */
router.get("/locate-users", AuthenticateUser, locateUsers);


/**
 * @swagger
 * /user/update-profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               bio:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 example: https://api.dicebear.com/7.x/avataaars/svg?seed=Alex
 *               isPrivate:
 *                 type: boolean
 *               interests:
 *                 type: array
 *                 items:
 *                   type: string
 *               location:
 *                 type: array
 *                 items:
 *                   type: string
 *               notificationSettings:
 *                 type: object
 *                 properties:
 *                   pushEnabled:
 *                     type: boolean
 *                   newMessages:
 *                     type: boolean
 *                   friendRequests:
 *                     type: boolean
 *                   systemAlerts:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       500:
 *         description: Profile update failed
 */
router.put("/update-profile", AuthenticateUser, updateProfile);

export default router;
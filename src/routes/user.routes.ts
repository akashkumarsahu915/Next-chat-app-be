import { Router } from "express";
import { searchUsers, locateUsers } from "../controllers/user/user.controller";
import { AuthenticateUser } from "../middleware/auth.middleware";
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
export default router;
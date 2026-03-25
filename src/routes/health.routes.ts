import { Router } from 'express';
import { checkHealth } from '../controllers/health.controller';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Check backend health status
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Backend is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: UP
 *                 timestamp:
 *                   type: string
 *                   example: 2024-03-24T18:25:44.201Z
 *                 message:
 *                   type: string
 *                   example: Backend API is healthy
 */
router.get('/', checkHealth);

export default router;

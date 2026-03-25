"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const health_controller_1 = require("../controllers/health.controller");
const router = (0, express_1.Router)();
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
router.get('/', health_controller_1.checkHealth);
exports.default = router;

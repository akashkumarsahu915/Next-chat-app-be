import { Router, Request, Response } from "express";
import uploadprofile from "../config/cloudinary/multer";
import { AuthenticateUser } from "../middleware/auth.middleware";

// console.log("Cloudinary route file loaded!");
const router = Router();

router.get("/test", (req, res) => {
  res.json({ message: "Cloudinary router is working!" });
});

/**
 * @swagger
 * /api/upload/profile:
 *   post:
 *     summary: Upload profile image
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Image uploaded successfully
 *                 imageUrl:
 *                   type: string
 *                   example: https://res.cloudinary.com/demo/image/upload/sample.jpg
 *       400:
 *         description: Missing image or bad request
 *       500:
 *         description: Upload failed
 */
router.post("/profile", AuthenticateUser, (req: Request, res: Response, next: any) => {
  uploadprofile.single("image")(req, res, (err: any) => {
    if (err) {
      console.error("Multer Error:", err);
      return res.status(400).json({
        message: "Multer upload error",
        error: err.message,
      });
    }

    try {
      const file = req.file as Express.Multer.File;

      if (!file) {
        return res.status(400).json({
          message: "No image uploaded",
        });
      }

      return res.status(200).json({
        message: "Image uploaded successfully",
        imageUrl: file.path, // ✅ Cloudinary URL
      });
    } catch (error: any) {
      console.error("Upload Logic Error:", error);
      return res.status(500).json({
        message: "Upload failed",
        error: error.message,
      });
    }
  });
});

export default router;

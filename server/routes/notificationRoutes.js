import express from "express";
import {
  registerToken,
  sendTestNotification,
  getNotifications,
  markAllAsRead
} from "../controllers/notificationController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register-token", authMiddleware, registerToken);
router.post("/send-test", authMiddleware, sendTestNotification);
router.post("/read", authMiddleware, markAllAsRead);
router.get("/", authMiddleware, getNotifications);


export default router;

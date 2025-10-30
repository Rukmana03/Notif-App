import express from "express";
import { getStatuses, createStatus, likeStatus, getStatusViewers, recordStatusView, deleteStatus } from "../controllers/statusController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getStatuses);
router.post("/", authMiddleware, createStatus);
router.post("/:statusId/like", authMiddleware, likeStatus);
router.get("/:statusId/viewers", authMiddleware, getStatusViewers);
router.post("/:statusId/view", authMiddleware, recordStatusView);
router.delete("/:statusId", authMiddleware, deleteStatus);

export default router;

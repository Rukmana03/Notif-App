// server/routes/contactRoutes.js
import express from "express";
import {
  createContact,
  getContacts,
  getPotentialContacts,
  deleteContact,
} from "../controllers/contactController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createContact);
router.get("/", authMiddleware, getContacts);
router.delete("/:contactId", authMiddleware, deleteContact);
router.get("/potential", authMiddleware, getPotentialContacts);

export default router;

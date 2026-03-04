import { Router } from "express";
import { createContactMessage, getContactMessagesAdmin } from "../controllers/contactController.js";
import { requireAdminAccess } from "../middleware/adminMiddleware.js";

const router = Router();

router.post("/", createContactMessage);
router.get("/admin", requireAdminAccess, getContactMessagesAdmin);

export default router;

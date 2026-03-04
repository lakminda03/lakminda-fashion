import { Router } from "express";
import { createCustomRequest, getCustomRequestsAdmin } from "../controllers/customRequestController.js";
import { requireAdminAccess } from "../middleware/adminMiddleware.js";

const router = Router();

router.post("/", createCustomRequest);
router.get("/admin", requireAdminAccess, getCustomRequestsAdmin);

export default router;

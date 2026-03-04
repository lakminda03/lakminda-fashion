import { Router } from "express";
import {
  createCheckoutIntent,
  getAllOrdersAdmin,
  getMyOrders,
  placeOrder,
  updateOrderStatusAdmin
} from "../controllers/orderController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireAdminAccess } from "../middleware/adminMiddleware.js";

const router = Router();

router.post("/checkout-intent", requireAuth, createCheckoutIntent);
router.post("/place", requireAuth, placeOrder);
router.get("/my", requireAuth, getMyOrders);

router.get("/admin", requireAdminAccess, getAllOrdersAdmin);
router.patch("/:id/status", requireAdminAccess, updateOrderStatusAdmin);

export default router;

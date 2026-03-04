import { Router } from "express";
import { addCartItem, clearCart, getCart, removeCartItem, updateCartItem } from "../controllers/cartController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.use(requireAuth);

router.get("/", getCart);
router.post("/items", addCartItem);
router.put("/items/:itemId", updateCartItem);
router.delete("/items/:itemId", removeCartItem);
router.delete("/clear", clearCart);

export default router;

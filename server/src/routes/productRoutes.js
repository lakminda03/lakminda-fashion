import { Router } from "express";
import {
  addOrUpdateProductReview,
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  getFeaturedProducts,
  seedAllProducts,
  updateProduct
} from "../controllers/productController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", getAllProducts);
router.get("/featured", getFeaturedProducts);
router.get("/:id", getProductById);
router.post("/:id/reviews", requireAuth, addOrUpdateProductReview);
router.post("/seed", seedAllProducts);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;

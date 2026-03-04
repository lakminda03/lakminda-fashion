import { Product } from "../models/Product.js";
import { seedProducts } from "../data/seedProducts.js";
import { User } from "../models/User.js";

const sanitizeSizePrices = (sizes, sizePrices, fallbackPrice) => {
  const normalizedSizes = Array.isArray(sizes) ? sizes : [];
  const rawPrices = sizePrices && typeof sizePrices === "object" ? sizePrices : {};
  const cleaned = {};

  normalizedSizes.forEach((size) => {
    const parsed = Number(rawPrices[size]);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      cleaned[size] = parsed;
    } else if (!Number.isNaN(Number(fallbackPrice)) && Number(fallbackPrice) >= 0) {
      cleaned[size] = Number(fallbackPrice);
    }
  });

  return cleaned;
};

export const getAllProducts = async (_req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products", error: error.message });
  }
};

export const getFeaturedProducts = async (_req, res) => {
  try {
    const products = await Product.find({ isFeatured: true }).sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch featured products", error: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.status(200).json(product);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch product", error: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      image,
      subCategory,
      category,
      description,
      isFeatured,
      colors,
      sizes,
      sizePrices,
      categories,
      tags,
      stockCount
    } = req.body;

    if (!name || price === undefined || !image || !(subCategory || category)) {
      return res
        .status(400)
        .json({ message: "name, price, image and subCategory are required" });
    }

    const product = await Product.create({
      name,
      price,
      image,
      subCategory: subCategory || category,
      description: description || "",
      isFeatured: Boolean(isFeatured),
      colors: Array.isArray(colors) ? colors : [],
      sizes: Array.isArray(sizes) ? sizes : [],
      sizePrices: sanitizeSizePrices(sizes, sizePrices, price),
      categories: Array.isArray(categories) ? categories : Array.isArray(tags) ? tags : [],
      stockCount: Number(stockCount) >= 0 ? Number(stockCount) : 0
    });

    return res.status(201).json(product);
  } catch (error) {
    return res.status(500).json({ message: "Failed to create product", error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      price,
      image,
      subCategory,
      category,
      description,
      isFeatured,
      colors,
      sizes,
      sizePrices,
      categories,
      tags,
      stockCount
    } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.name = name ?? product.name;
    product.price = price ?? product.price;
    product.image = image ?? product.image;
    product.subCategory = subCategory ?? category ?? product.subCategory;
    product.description = description ?? product.description;
    product.isFeatured = isFeatured ?? product.isFeatured;
    product.colors = Array.isArray(colors) ? colors : product.colors;
    product.sizes = Array.isArray(sizes) ? sizes : product.sizes;
    product.sizePrices =
      sizePrices && typeof sizePrices === "object"
        ? sanitizeSizePrices(product.sizes, sizePrices, product.price)
        : sanitizeSizePrices(product.sizes, product.sizePrices, product.price);
    product.categories = Array.isArray(categories)
      ? categories
      : Array.isArray(tags)
        ? tags
        : product.categories;
    if (stockCount !== undefined) {
      const parsedStock = Number(stockCount);
      product.stockCount = Number.isNaN(parsedStock) || parsedStock < 0 ? 0 : parsedStock;
    }

    const updated = await product.save();
    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update product", error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({ message: "Product deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete product", error: error.message });
  }
};

export const seedAllProducts = async (_req, res) => {
  try {
    await Product.deleteMany();
    const inserted = await Product.insertMany(seedProducts);
    res.status(201).json({
      message: "Products seeded successfully",
      count: inserted.length
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to seed products", error: error.message });
  }
};

export const addOrUpdateProductReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment = "" } = req.body;
    const numericRating = Number(rating);

    if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: "rating must be between 1 and 5" });
    }

    const [product, user] = await Promise.all([
      Product.findById(id),
      User.findById(req.user.userId).select("name")
    ]);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingReview = product.reviews.find(
      (review) => String(review.user) === String(req.user.userId)
    );

    if (existingReview) {
      existingReview.rating = numericRating;
      existingReview.comment = String(comment || "").trim();
      existingReview.name = user.name;
      existingReview.updatedAt = new Date();
    } else {
      product.reviews.push({
        user: req.user.userId,
        name: user.name,
        rating: numericRating,
        comment: String(comment || "").trim()
      });
    }

    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
      Math.max(product.reviews.length, 1);

    const updated = await product.save();
    return res.status(201).json({
      message: existingReview ? "Review updated" : "Review added",
      product: updated
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to submit review", error: error.message });
  }
};

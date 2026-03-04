import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      default: "",
      trim: true
    }
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    image: {
      type: String,
      required: true
    },
    subCategory: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ""
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    colors: {
      type: [String],
      default: []
    },
    sizes: {
      type: [String],
      default: []
    },
    sizePrices: {
      type: Map,
      of: Number,
      default: {}
    },
    categories: {
      type: [String],
      default: []
    },
    stockCount: {
      type: Number,
      default: 0,
      min: 0
    },
    reviews: {
      type: [reviewSchema],
      default: []
    },
    numReviews: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

export const Product = mongoose.model("Product", productSchema);

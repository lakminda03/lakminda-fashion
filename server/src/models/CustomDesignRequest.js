import mongoose from "mongoose";

const customDesignRequestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    designIdea: {
      type: String,
      required: true,
      trim: true
    },
    deadline: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

export const CustomDesignRequest = mongoose.model("CustomDesignRequest", customDesignRequestSchema);

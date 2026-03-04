import { CustomDesignRequest } from "../models/CustomDesignRequest.js";

export const createCustomRequest = async (req, res) => {
  try {
    const { name, email, phone, category, quantity, designIdea, deadline } = req.body;

    if (!name || !email || !phone || !category || !quantity || !designIdea) {
      return res.status(400).json({
        message: "name, email, phone, category, quantity and designIdea are required"
      });
    }

    const parsedQuantity = Number(quantity);
    if (Number.isNaN(parsedQuantity) || parsedQuantity < 1) {
      return res.status(400).json({ message: "quantity must be at least 1" });
    }

    let parsedDeadline = null;
    if (deadline) {
      const date = new Date(deadline);
      if (Number.isNaN(date.getTime())) {
        return res.status(400).json({ message: "Invalid deadline date" });
      }
      parsedDeadline = date;
    }

    const request = await CustomDesignRequest.create({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: String(phone).trim(),
      category: String(category).trim(),
      quantity: parsedQuantity,
      designIdea: String(designIdea).trim(),
      deadline: parsedDeadline
    });

    return res.status(201).json({
      message: "Custom design request submitted successfully",
      request
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to submit custom design request", error: error.message });
  }
};

export const getCustomRequestsAdmin = async (_req, res) => {
  try {
    const requests = await CustomDesignRequest.find().sort({ createdAt: -1 });
    return res.status(200).json(requests);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch custom design requests", error: error.message });
  }
};

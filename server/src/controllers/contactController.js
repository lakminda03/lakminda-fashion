import { ContactMessage } from "../models/ContactMessage.js";

export const createContactMessage = async (req, res) => {
  try {
    const { name, email, phone = "", subject, message } = req.body || {};

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: "name, email, subject and message are required" });
    }

    const saved = await ContactMessage.create({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: String(phone || "").trim(),
      subject: String(subject).trim(),
      message: String(message).trim()
    });

    return res.status(201).json({
      message: "Message sent successfully",
      contactMessage: saved
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to submit contact message", error: error.message });
  }
};

export const getContactMessagesAdmin = async (_req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    return res.status(200).json(messages);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch contact messages", error: error.message });
  }
};

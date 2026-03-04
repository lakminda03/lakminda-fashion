export const requireAdminAccess = (req, res, next) => {
  const adminKey = req.headers["x-admin-key"];
  const expected = process.env.ADMIN_API_KEY || "LkF@2026#Admin!Secure9";

  if (!adminKey || adminKey !== expected) {
    return res.status(403).json({ message: "Admin access denied" });
  }

  return next();
};

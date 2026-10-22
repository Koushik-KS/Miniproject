
import jwt from "jsonwebtoken";

export function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 24 * 60 * 60 * 1000,
  };
}

export function requireAuth(req, res, next) {
  const token = req.cookies?.kv_token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Please sign in to continue.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid session. Please sign in again.",
      });
    }

    req.userId = decoded.userId;
    next();
  } catch {
    res.clearCookie("kv_token", getCookieOptions());

    return res.status(401).json({
      success: false,
      message: "Your session has expired. Please sign in again.",
    });
  }
}

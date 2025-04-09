const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access Denied: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.role) {
      return res.status(401).json({ message: "Invalid token: Role missing" });
    }

    req.userId = decoded.userId || null; // For users/sellers
    req.role = decoded.role; // Attach role ('admin', 'seller', 'user')

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return res.status(401).json({ message: "Invalid Token" });
  }
};

module.exports = authMiddleware;

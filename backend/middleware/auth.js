const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Access denied. No token provided."
      });
    }

    // Remove "Bearer "
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Invalid token."
      });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Save logged-in user id
    req.user = decoded;

    next();

  } catch (err) {
    return res.status(401).json({
      message: "Token is not valid."
    });
  }
};

module.exports = auth;
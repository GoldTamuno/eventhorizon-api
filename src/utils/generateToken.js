const jwt = require("jsonwebtoken");

/**
 * Generates a signed JWT for an authenticated session.
 * This token is completely separate from the email verification token:
 * it is short-lived, used only for authenticating API requests, and
 * carries no verification purpose.
 */
const generateAuthToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });
};

module.exports = generateAuthToken;

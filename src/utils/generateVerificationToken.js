const crypto = require("crypto");

/**
 * Generates a secure, random, time-sensitive email verification token.
 *
 * Design:
 * - The RAW token (long random hex string) is what gets emailed to the
 *   user inside the verification link. It is never stored in the database.
 * - A SHA-256 HASH of the raw token is what gets stored in the database.
 *   When the user clicks the link, we hash the token they send us and
 *   compare it to the stored hash. This is the same pattern used for
 *   "forgot password" flows, and it means a database leak alone cannot
 *   be used to verify arbitrary accounts.
 * - `expiresAt` enforces the "time-sensitive" requirement: tokens older
 *   than EMAIL_VERIFICATION_EXPIRES_IN_MINUTES are rejected.
 */
const generateVerificationToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  const expiresInMinutes =
    parseInt(process.env.EMAIL_VERIFICATION_EXPIRES_IN_MINUTES, 10) || 30;
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  return { rawToken, hashedToken, expiresAt };
};

const hashToken = (rawToken) => {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
};

module.exports = { generateVerificationToken, hashToken };

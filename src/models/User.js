const mongoose = require("mongoose");

/**
 * User schema.
 *
 * Notes on security-sensitive fields:
 * - `password` is always stored as a bcrypt hash, never plain text.
 * - `emailVerificationToken` stores a SHA-256 HASH of the token that was
 *   emailed to the user, not the raw token itself. This mirrors how we
 *   should treat any secret token: if the database were ever leaked,
 *   the raw tokens (which could be used to verify accounts) would not
 *   be exposed.
 * - `isVerified` gates login and access to protected routes.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      default: undefined,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      default: undefined,
      select: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

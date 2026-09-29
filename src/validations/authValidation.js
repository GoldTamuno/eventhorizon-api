const Joi = require("joi");

/**
 * Password rule: at least 8 characters, and alphanumeric
 * (must contain at least one letter and one number).
 * We use a regex pattern rather than Joi's built-in `alphanum()`
 * because `alphanum()` would reject useful special characters and
 * doesn't enforce "must contain both a letter and a number" on its own.
 */
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\W]{8,}$/;

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(60).required().messages({
    "string.empty": "Name is required",
    "string.min": "Name must be at least 2 characters long",
  }),
  email: Joi.string().trim().email().required().messages({
    "string.email": "Please provide a valid email address",
    "string.empty": "Email is required",
  }),
  password: Joi.string().pattern(passwordPattern).required().messages({
    "string.pattern.base":
      "Password must be at least 8 characters long and contain both letters and numbers",
    "string.empty": "Password is required",
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required().messages({
    "string.email": "Please provide a valid email address",
    "string.empty": "Email is required",
  }),
  password: Joi.string().required().messages({
    "string.empty": "Password is required",
  }),
});

const verifyEmailSchema = Joi.object({
  token: Joi.string().required().messages({
    "string.empty": "Verification token is required",
  }),
});

module.exports = { registerSchema, loginSchema, verifyEmailSchema };

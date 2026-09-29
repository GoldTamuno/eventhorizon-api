const bcrypt = require("bcrypt");
const User = require("../models/User");
const generateAuthToken = require("../utils/generateToken");
const {
  generateVerificationToken,
  hashToken,
} = require("../utils/generateVerificationToken");
const { sendVerificationEmail } = require("../utils/sendEmail");
const {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
} = require("../validations/authValidation");

const SALT_ROUNDS = 12;

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user, hash their password, generate a
 *          time-sensitive email verification token, and email it.
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { name, email, password } = value;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with that email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Generate a verification token separate from the login JWT.
    const { rawToken, hashedToken, expiresAt } = generateVerificationToken();

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      isVerified: false,
      emailVerificationToken: hashedToken,
      emailVerificationExpires: expiresAt,
    });

    // Attempt to send the verification email. If it fails, the user still
    // exists but is told clearly so they aren't left confused.
    try {
      await sendVerificationEmail(user.email, user.name, rawToken);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError.message);
      return res.status(201).json({
        success: true,
        message:
          "Account created, but the verification email could not be sent. Please contact support or request a new verification email.",
        userId: user._id,
      });
    }

    res.status(201).json({
      success: true,
      message:
        "Account created successfully. Please check your email to verify your account before logging in.",
      userId: user._id,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate a user and issue a JWT.
 *          Unverified users are blocked from logging in.
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email, password } = value;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message:
          "Please verify your email before logging in. Check your inbox for the verification link.",
      });
    }

    const token = generateAuthToken(user._id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/verify-email?token=xyz123
 * @desc    Validates a verification token and marks the user as verified.
 * @access  Public
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { error, value } = verifyEmailSchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { token } = value;
    const hashedToken = hashToken(token);

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() },
    }).select("+emailVerificationToken +emailVerificationExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Verification link is invalid or has expired",
      });
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, verifyEmail };

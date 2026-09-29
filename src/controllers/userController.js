/**
 * @route   GET /api/user/profile
 * @desc    Returns the logged-in, verified user's profile.
 * @access  Private (requires valid JWT + verified account)
 */
const getProfile = async (req, res, next) => {
  try {
    // req.user was attached by the `protect` middleware
    const user = req.user;

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile };

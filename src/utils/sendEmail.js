const nodemailer = require("nodemailer");

/**
 * Creates a reusable transporter using SMTP credentials from environment
 * variables. Works with Gmail (App Password), Mailtrap, SendGrid SMTP,
 * or any standard SMTP provider - just change the .env values.
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: Number(process.env.EMAIL_PORT) === 465, // true for port 465, false for others
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Sends the account verification email containing the link the frontend
 * will use, e.g. http://your-frontend-url/verify-email?token=xyz123
 */
const sendVerificationEmail = async (toEmail, name, rawToken) => {
  const transporter = createTransporter();

  const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${rawToken}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: toEmail,
    subject: "Verify your EventHorizon account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2>Welcome to EventHorizon, ${name}!</h2>
        <p>Please confirm your email address to activate your account.</p>
        <p>
          <a href="${verificationLink}"
             style="background:#4f46e5;color:#fff;padding:10px 18px;
             border-radius:6px;text-decoration:none;display:inline-block;">
            Verify Email
          </a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p>${verificationLink}</p>
        <p>This link expires in ${process.env.EMAIL_VERIFICATION_EXPIRES_IN_MINUTES || 30} minutes.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail };

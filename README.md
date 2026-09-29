# EventHorizon API — Backend Foundation

A secure Node.js + Express + MongoDB backend foundation for **EventHorizon**, a platform for managing local tech meetups. This service handles user registration, login, JWT-based authorization, and token-based email verification (no OTP).

## Features

- **MongoDB + Mongoose** for data storage
- **Joi** validation on all registration/login input
- **bcrypt** password hashing (12 salt rounds)
- **JWT** issued on login for session authentication
- **Token-based email verification** — a separate, time-sensitive, single-use, cryptographically random token (hashed before being stored, like a password-reset token), emailed as a verification link
- Unverified users are **blocked from logging in and from protected routes**
- Centralized error handling with clean, consistent JSON responses and correct HTTP status codes

## Tech Stack

Node.js, Express, MongoDB/Mongoose, Joi, bcrypt, jsonwebtoken, nodemailer, cors, dotenv.

## Project Structure

```
eventhorizon-api/
├── server.js
├── package.json
├── .env.example
├── EventHorizon.postman_collection.json
└── src/
    ├── config/
    │   └── db.js
    ├── models/
    │   └── User.js
    ├── validations/
    │   └── authValidation.js
    ├── utils/
    │   ├── generateToken.js              # login JWT
    │   ├── generateVerificationToken.js  # email verification token
    │   └── sendEmail.js
    ├── middleware/
    │   ├── auth.js
    │   └── errorHandler.js
    ├── controllers/
    │   ├── authController.js
    │   └── userController.js
    └── routes/
        ├── authRoutes.js
        └── userRoutes.js
```

## Getting Started

### 1. Prerequisites

- Node.js v18+
- A MongoDB connection string (local MongoDB, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)
- An SMTP account for sending email (Gmail with an [App Password](https://myaccount.google.com/apppasswords), or a testing service like [Mailtrap](https://mailtrap.io))

### 2. Clone and install

```bash
git clone <your-repo-url>
cd eventhorizon-api
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env` and fill in your own values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `PORT` | Port the server runs on (default `5000`) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign login session JWTs |
| `JWT_EXPIRES_IN` | Login token lifetime, e.g. `1d` |
| `EMAIL_VERIFICATION_SECRET` | A separate secret, kept for future use/rotation (the current implementation uses a random token hash rather than a signed JWT for verification, for extra security — see "Design Decisions" below) |
| `EMAIL_VERIFICATION_EXPIRES_IN_MINUTES` | How long the verification link stays valid, e.g. `30` |
| `FRONTEND_URL` | Base URL used to build the verification link |
| `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_USER` / `EMAIL_PASS` / `EMAIL_FROM` | SMTP credentials for sending the verification email |

### 4. Run the server

```bash
npm run dev     # with nodemon, auto-restarts on changes
# or
npm start
```

The API will be available at `http://localhost:5000`.

## API Reference

### `POST /api/auth/register`
Registers a new user, hashes the password, generates a verification token, and emails a verification link.

**Body:**
```json
{ "name": "Ada Lovelace", "email": "ada@example.com", "password": "Passw0rd123" }
```
Password must be **at least 8 characters** and contain **both letters and numbers**.

**Responses:** `201 Created` on success · `400` on validation failure · `409` if the email is already registered.

### `GET /api/auth/verify-email?token=xyz123`
Validates the token from the emailed link. If valid and not expired, marks the account as verified.

**Responses:** `200 OK` on success · `400` if the token is invalid, already used, or expired.

### `POST /api/auth/login`
Authenticates a user and returns a JWT. **Blocked for unverified accounts.**

**Body:**
```json
{ "email": "ada@example.com", "password": "Passw0rd123" }
```

**Responses:** `200 OK` with `{ token, user }` · `401` on wrong credentials · `403` if the email isn't verified yet.

### `GET /api/user/profile` (protected)
Returns the logged-in user's profile. Requires header:
```
Authorization: Bearer <token>
```

**Responses:** `200 OK` with user data · `401` if the token is missing/invalid/expired · `403` if the account isn't verified.

## Design Decisions & Security Notes

- **Two separate tokens, two separate purposes.** The login JWT (`generateToken.js`) authenticates API requests. The email verification token (`generateVerificationToken.js`) is a random 32-byte value generated with `crypto.randomBytes`, unrelated to JWT, so it cannot be reused for authentication and doesn't need to carry a payload.
- **Verification tokens are hashed at rest.** Only the SHA-256 hash of the token is stored in MongoDB — the same pattern used for password-reset flows — so a database leak alone can't be used to verify accounts.
- **Expiry is enforced at the database query level** (`emailVerificationExpires: { $gt: new Date() }`), not just checked in application code after fetching.
- **Passwords are never stored or logged in plain text**; bcrypt with 12 salt rounds is used.
- **Unverified users are rejected at both login and at the `protect` middleware**, so even a leaked/guessed JWT for an unverified account can't reach protected routes.

## Testing the API

Import `EventHorizon.postman_collection.json` into Postman (or Insomnia). It includes requests for Register → Verify Email → Login → Get Profile, using collection variables (`baseUrl`, `authToken`, `verificationToken`) so you can copy the token from one response into the next request.

Since the verification link points at `FRONTEND_URL`, during testing you can simply copy the `token` query parameter out of the received email URL and paste it into the `verify-email` request instead of clicking the link.

## Challenges & Notes

- Choosing between a signed JWT and an opaque random token for email verification: a JWT would technically satisfy "time-sensitive," but a random, hashed, single-use token more closely matches how verification/reset tokens are handled in production systems and avoids exposing any user data in the token itself.
- Nodemailer requires real SMTP credentials to actually send mail — for local development without a mail provider, a tool like Mailtrap is recommended so you don't need a real inbox.

## License

ISC

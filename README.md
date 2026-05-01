# SkillPilot – Backend API

Welcome to the backend repository for **SkillPilot**, a comprehensive career guidance and mentorship platform built as a MERN-stack application.

## 🚀 Overview

The SkillPilot backend provides a robust, secure, and highly scalable RESTful API that powers the entire ecosystem. It handles authentication, psychometric assessment scoring, booking management, Stripe payments, AI integration via Google Gemini, real-time WebSockets, and complex Role-Based Access Control (RBAC).

## 🛠 Technology Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB Atlas (Mongoose ODM)
- **Authentication:** JWT, bcryptjs, Google OAuth 2.0
- **AI Integration:** Google Gemini API (`gemini-2.5-flash`)
- **Emails:** Nodemailer (SMTP) with HTML templates
- **File Uploads:** Multer (disk storage)
- **Payments:** Stripe / Razorpay (Checkout & Webhooks)
- **Task Scheduling:** `node-cron`
- **Security:** `helmet`, `cors`, `compression`, custom rate-limiting
- **Real-time:** `ws` (WebSockets) for live admin server logs

## ✨ Core Modules

- **Authentication & Security:** Secure email/password login, Google OAuth, automated email verification, brute-force protection, geo-IP checks, and robust RBAC middleware (`verifyToken`, `isMentor`, `adminOnly`).
- **Profile Management:** Dynamic, lazily-created profiles handling education, experience, projects, skills, and certifications.
- **RIASEC Assessment Engine:** Custom algorithm to evaluate user answers against Holland Code domains (R, I, A, S, E, C) and match them to careers stored in the database.
- **Mentor Ecosystem:** Application flows, Topmate-style service creation, discount coupons, custom profile sections, and mentor analytics.
- **Booking & Session Management:** Complete lifecycle management from checking slot availability to processing payments, sending Jitsi meeting links, and collecting post-session ratings.
- **Priority DM System:** Asynchronous, thread-based paid messaging system with auto-expiring sessions.
- **University Management:** Bulk onboarding of institutions, generating credentials for UniAdmins, Teachers, and Students via Excel exports.
- **AI Proxy:** Securely proxies and structures prompts for the Google Gemini API to power the Chatbot, Career Advisor, and Quiz Predictions.
- **Cron Jobs:** Automated email reminders for upcoming bookings (1hr, 30m, 10m intervals) and password change enforcements.

## 📁 Project Structure

```text
Server-college 2/
├── index.js                # Entry point, mounts routes, starts Express & WebSocket server
├── db.js                   # MongoDB connection configuration
│
├── config/                 # Google Auth, Nodemailer helpers, and email templates
├── middleware/             # Auth guards, Multer upload config, portal access checks
├── models/                 # 47 Mongoose Schemas (User, MentorBooking, Assessment, etc.)
├── controllers/            # 20 controllers containing core business logic
├── routes/                 # 33 isolated Express router files defining the API endpoints
├── jobs/                   # node-cron scheduled tasks (reminders, expirations)
└── uploads/                # Local storage for Multer (profile images, custom sections)
```

## ⚙️ Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB Atlas Account (or local MongoDB instance)
- Google Gemini API Key
- Stripe API Keys
- SMTP Credentials (for Nodemailer)

### Installation

1. Clone the repository and navigate to the backend directory:

   ```bash
   cd "Server-college 2"
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the root directory:

   ```env
   PORT=3001
   MONGO_URI=mongodb+srv://<user>:<password>@cluster...
   JWT_SECRET=your_super_secret_jwt_key
   FRONTEND_URL=http://localhost:5173

   # AI
   GEMINI_API_KEY=your_gemini_api_key

   # Email Config
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password

   # Payments
   STRIPE_SECRET_KEY=your_stripe_secret
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   STRIPE_CURRENCY=inr
   PLATFORM_FEE_PERCENT=15
   ```

4. Start the server (Development mode):
   ```bash
   npm run dev
   ```
   _(Uses `nodemon` to auto-restart on file changes)_

The API will be available at `http://localhost:3001`.
Live logs can be accessed via WebSocket at `ws://localhost:3001/ws/logs`.

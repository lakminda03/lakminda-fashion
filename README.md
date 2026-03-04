# Lakminda Fashion - MERN E-Commerce Platform

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=111)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?logo=stripe&logoColor=white)](https://stripe.com/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](#license)

Full-stack fashion storefront built with **MongoDB, Express, React, and Node.js**.

It includes:
- Customer shopping experience with category pages, product pages, cart, and checkout
- Admin dashboard for product management, order management, custom requests, and contact messages
- Email-based user account verification and password reset via SMTP
- Stripe payment intent flow and order placement

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Run Scripts](#run-scripts)
- [API Endpoints](#api-endpoints)
- [Authentication and Roles](#authentication-and-roles)
- [Troubleshooting](#troubleshooting)
- [Deployment Notes](#deployment-notes)
- [License](#license)

---

## Features

### Storefront
- Home page with hero section, featured products, and category/sub-category sections
- Category pages: Men, Women, Kids, Unisex
- Product details page with:
  - Color selector
  - Size selector
  - Quantity selector (bounded by stock)
  - Add to cart
  - Customer reviews
- Account pages:
  - Register
  - Login
  - Verify email
  - Forgot password
  - Reset password
  - My account and order history
- Cart + checkout flow with Stripe payment intent
- Contact page and custom design request page

### Admin Panel
- Admin sign-in
- Vertical section navigation
- Product manager:
  - Create/edit/delete products
  - Image upload
  - Stock control
  - Featured flag
  - Sizes and per-size pricing
  - Colors
  - Categories and sub-categories
- Product list with filters and sorting
- Order management with status updates
- Analytics cards and insights:
  - Total orders
  - Total revenue
  - Top 3 products
  - Top 10 customers
  - Last 12 months orders chart
- Custom design requests view
- Contact messages view

### Security and Validation
- Password hashing with `bcryptjs`
- JWT auth for user sessions
- Token-based email verification and password reset
- Admin-protected API routes via `x-admin-key`
- Input validation and sanitization in auth flows

---

## Tech Stack

### Frontend
- React 18
- React Router
- Vite
- Stripe React SDK

### Backend
- Node.js
- Express
- MongoDB + Mongoose
- Nodemailer (SMTP)
- Multer (image upload)
- Stripe server SDK

---

## Project Structure

```text
lakminda-fashion-mern/
|- client/                  # React app (Vite)
|  |- src/
|  |  |- components/
|  |  |- context/
|  |  |- pages/
|  |  |- utils/
|- server/                  # Express API
|  |- src/
|  |  |- config/
|  |  |- controllers/
|  |  |- data/
|  |  |- middleware/
|  |  |- models/
|  |  |- routes/
|  |  |- utils/
|  |- uploads/              # Uploaded product images
|- package.json             # Root scripts (run client + server)
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- MongoDB local instance or cloud URI

### 1. Clone

```bash
git clone <your-repo-url>
cd lakminda-fashion-mern
```

### 2. Install dependencies

```bash
npm run install:all
```

### 3. Configure environment files

Create these files:
- `server/.env`
- `client/.env`

Use the templates below.

### 4. Start development servers

```bash
npm run dev
```

Frontend:
- `http://localhost:5173`

Backend:
- `http://localhost:5000`

---

## Environment Variables

### `server/.env`

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/lakminda_fashion
CLIENT_URL=http://localhost:5173
JWT_SECRET=replace_with_a_strong_secret
STRIPE_SECRET_KEY=sk_test_replace_this
ADMIN_API_KEY=replace_with_a_strong_admin_api_key

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_no_spaces
SMTP_FROM=your_email@gmail.com
SMTP_FROM_NAME=Lakminda Fashion
MAIL_DOMAIN=gmail.com
```

### `client/.env`

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_replace_this
VITE_ADMIN_API_KEY=replace_with_the_same_admin_api_key_as_server
```

Important:
- `VITE_ADMIN_API_KEY` and `ADMIN_API_KEY` must match.
- Restart the dev server after any `.env` change.
- For Gmail SMTP, enable 2FA and use an App Password.

---

## Run Scripts

### Root
- `npm run dev` - run client + server together
- `npm run install:all` - install root/client/server deps
- `npm run build` - build frontend

### Server
- `npm run dev --prefix server` - start backend with nodemon
- `npm run start --prefix server` - start backend in production mode

### Client
- `npm run dev --prefix client` - run Vite dev server
- `npm run build --prefix client` - production build
- `npm run preview --prefix client` - preview production build

---

## API Endpoints

### Health
- `GET /api/health`

### Products
- `GET /api/products`
- `GET /api/products/featured`
- `GET /api/products/:id`
- `POST /api/products/seed`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`
- `POST /api/products/:id/reviews`

### Uploads
- `POST /api/uploads` (multipart/form-data, field: `image`)

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/verify-email`
- `POST /api/auth/resend-verification`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/me`

### Cart
- `GET /api/cart`
- `POST /api/cart/items`
- `PUT /api/cart/items/:itemId`
- `DELETE /api/cart/items/:itemId`
- `DELETE /api/cart/clear`

### Orders
- `POST /api/orders/checkout-intent`
- `POST /api/orders/place`
- `GET /api/orders/my`
- `GET /api/orders/admin`
- `PATCH /api/orders/:id/status`

### Custom Requests
- `POST /api/custom-requests`
- `GET /api/custom-requests/admin`

### Contact
- `POST /api/contact-messages`
- `GET /api/contact-messages/admin`

---

## Authentication and Roles

### User
- Registers and verifies email
- Logs in with JWT auth
- Can add to cart, checkout, review products, and view own orders

### Admin
- Signs in to `/admin`
- Uses `x-admin-key` protected endpoints for admin data/actions
- Manages products and monitors orders/requests/messages

---

## Troubleshooting

### "Admin access denied"
- Ensure `server/.env` `ADMIN_API_KEY` equals `client/.env` `VITE_ADMIN_API_KEY`
- Restart both frontend and backend after updates

### "SMTP not configured"
- Means `SMTP_HOST`, `SMTP_USER`, or `SMTP_PASS` were missing at server startup
- Verify `.env` values and restart backend

### Verification email not received
- Check Spam/Promotions
- Confirm Gmail app password
- Confirm backend logs for SMTP auth errors

### Vite import errors / package missing
- Run:
  - `npm install --prefix client`
  - `npm install --prefix server`

---

## Deployment Notes

- Build frontend with `npm run build --prefix client`
- Serve `client/dist` via static hosting or reverse proxy
- Run backend with `npm run start --prefix server`
- Configure production env vars on server
- Use HTTPS in production for auth and payment security

---

## License

ISC License.


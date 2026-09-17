# Huququlator V2

Huququlator is a financial tool designed to help individuals calculate Ḥuqúqu’lláh. It features a public standalone calculator, as well as a private, authenticated dashboard where users can track their assets/debts over time, upload bank statements via CSV, and create rules to automatically categorize financial transactions.

This project is a complete Version 2 rewrite, migrating from a monolithic EJS/Node setup to a modern, decoupled React and Express.js architecture.

## 🚀 Technology Stack

### Frontend (`/client`)
*   **React 18:** Component-based UI for instant, dynamic math recalculations without page reloads.
*   **Vite:** Lightning-fast build tool and development server.
*   **React Router DOM:** For seamless client-side routing and protected routes.
*   **Axios:** Configured with interceptors to securely pass HTTP-only cookies for authentication.
*   **Native CSS:** Custom CSS utilizing CSS Variables for automatic Light/Dark mode switching based on OS preferences.

### Backend (`/server`)
*   **Node.js & Express:** Lightweight, modular REST API.
*   **MySQL2:** Promise-based database driver utilizing connection pooling for high performance.
*   **Authentication:** `bcrypt` for password hashing and `jsonwebtoken` (JWT) delivered via secure, HTTP-only cookies.
*   **Data Processing:** `multer` and `fast-csv` for handling and parsing large financial CSV uploads, utilizing bulk-insert SQL queries to prevent N+1 bottlenecks.
*   **Axios & Axios-Retry:** For resilient external API calls to fetch historical gold rates (MetalPriceAPI / GoldAPI).

### Deployment
*   **PM2:** Production process manager to keep the Node backend running continuously.

---

## 📂 Project Structure

```text
huququlator-v2/
├── README.md
├── ecosystem.config.js       # PM2 configuration file for deployment
│
├── client/                   # REACT FRONTEND
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── public/
│   │   └── images/           # Static assets and screenshots
│   └── src/
│       ├── App.jsx           # Main entry point and Route definitions
│       ├── main.jsx
│       ├── api/
│       │   └── axios.js      # Global Axios instance configured for CORS/Cookies
│       ├── components/       # Reusable UI elements
│       │   ├── Navbar.jsx
│       │   ├── Sidebar.jsx
│       │   └── ProtectedRoute.jsx
│       ├── context/          
│       │   └── AuthContext.jsx # Global state for the logged-in user
│       ├── pages/            # View components
│       │   ├── Home.jsx      # Public Calculator
│       │   ├── Dashboard.jsx # Interactive financial grid
│       │   ├── Upload.jsx    # CSV parsing and rules application
│       │   ├── Transactions.jsx # Tabbed view for categorizing expenses
│       │   ├── FilterRules.jsx
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── About.jsx
│       │   └── Help.jsx
│       └── styles/           # Application stylesheets
│           ├── global.css
│           ├── dashboard.css
│           └── static.css
│
└── server/                   # NODE/EXPRESS BACKEND
    ├── package.json
    ├── .env                  # Environment variables (DB credentials, API keys)
    ├── server.js             # API entry point and middleware configuration
    ├── config/
    │   └── db.js             # MySQL connection pool
    ├── controllers/          # Business logic
    │   ├── authController.js
    │   ├── dashboardController.js
    │   ├── ruleController.js
    │   ├── transactionController.js
    │   └── uploadController.js
    ├── middlewares/
    │   └── auth.js           # JWT verification middleware
    ├── routes/               # API endpoint definitions
    │   ├── authRoutes.js
    │   ├── dashboardRoutes.js
    │   ├── publicRoutes.js
    │   ├── ruleRoutes.js
    │   ├── transactionRoutes.js
    │   └── uploadRoutes.js
    └── services/
        └── goldService.js    # External API fetching with caching and fallback
```

## 🛠️ Getting Started Locally

1. **Database Setup:** Ensure MariaDB/MySQL is running and your `huququlator` schema is imported.
2. **Environment Variables:** Create a `.env` file in the `/server` directory with your database credentials, JWT secret, and Gold API keys.
3. **Run the Backend:**
   ```bash
   cd server
   npm install
   npm run dev      # or: node server.js
   ```
4. **Run the Frontend:**
   ```bash
   cd client
   npm install
   npm run dev
   ```
5. **Access the App:** Open `http://localhost:5173` in your browser.

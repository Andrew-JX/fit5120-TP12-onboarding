# FIT5120 TP12 — The Generational Shift in Sun-Safety Attitudes

> A web application helping Gen Z Australians understand UV risks and make safer outdoor decisions.

## Project Structure

```
fit5120-tp12/
├── frontend/          # Vue 3 + Vite
├── backend/           # Node.js + Express
└── README.md
```

### Prerequisites

- Node.js >= 18
- PostgreSQL（Local / Render ）
- Git

---

## 1. repository and dependencies

```bash
git clone https://github.com/Andrew-JX/fit5120-TP12-onboarding.git
cd fit5120-TP12-onboarding

# frontend
cd frontend && npm install

# backend
cd ../backend && npm install
```

---

## 2. Configuring Environment Variables

**Backend:**

```bash
cd backend
cp .env.example .env
# Open .env and fill in:
#   DATABASE_URL   — your PostgreSQL connection string
#   SESSION_SECRET — any long random string (32+ chars)
#   OPENWEATHER_API_KEY — free key from openweathermap.org
#   FRONTEND_URL   — http://localhost:5173 for local dev
```

**Frontend:**

```bash
cd frontend
cp .env.example .env
# For local dev, leave VITE_API_URL empty (Vite proxy handles it)
# For production: VITE_API_URL=https://your-backend.onrender.com
```

---

## 3. Initialize the database

```bash
cd backend
npm run db:init
npm run db:seed        # Insert test data
```

---

## 4. Local Operation

```bash
# Terminal 1: Running the backend (port 3000)
cd backend && npm run dev

# Terminal 2: Running the front-end (port 5173)
cd frontend && npm run dev
```

Open in browser http://localhost:5173

**test account：**

- username: `demo` / password: `demo123`
- username: `admin` / password: `admin123`

---

## 5. Deployment

### frontend → Vercel

```bash
cd frontend
# Ensure that vercel.json exists in the root directory.
#   Framework: Vite
#   Build Command: npm run build
#   Output Directory: dist
#   Environment Variable: VITE_API_URL = https://your-backend.onrender.com
```

### backend → Render

```bash
# Root Directory: backend
# Build Command: npm install
# Start Command: npm start
# Configure all environment variables（ .env.example）
```

### database → Render PostgreSQL

```bash
# Create a PostgreSQL instance in Render
# Populate the Internal Database URL into the backend environment variable DATABASE_URL
# Then run npm run db:init && npm run db:seed
```

---

## 6. API Reference

### Auth

| Method | Endpoint           | Body                   | Auth | Description         |
| ------ | ------------------ | ---------------------- | ---- | ------------------- |
| POST   | `/api/auth/login`  | `{username, password}` | —    | Login, sets session |
| POST   | `/api/auth/logout` | —                      | ✓    | Destroy session     |
| GET    | `/api/auth/me`     | —                      | ✓    | Current user info   |

### UV

| Method | Endpoint            | Params            | Auth | Description                   |
| ------ | ------------------- | ----------------- | ---- | ----------------------------- |
| GET    | `/api/uv/current`   | `?city=melbourne` | —    | Real-time UV (cached 30 min)  |
| GET    | `/api/uv/advice`    | `?index=7`        | —    | Advice for UV level           |
| GET    | `/api/uv/locations` | —                 | —    | List of AU cities             |
| POST   | `/api/uv/log`       | `{uvIndex, city}` | ✓    | Log UV exposure               |
| GET    | `/api/uv/history`   | —                 | ✓    | 7-day UV log for current user |

### Diary

| Method | Endpoint         | Body/Params                                          | Auth | Description      |
| ------ | ---------------- | ---------------------------------------------------- | ---- | ---------------- |
| POST   | `/api/diary`     | multipart: `photo`, `bodyPart`, `notes`, `entryDate` | ✓    | Create entry     |
| GET    | `/api/diary`     | `?bodyPart=arm&sortBy=date_desc&page=1&limit=10`     | ✓    | List entries     |
| GET    | `/api/diary/:id` | —                                                    | ✓    | Get single entry |
| DELETE | `/api/diary/:id` | —                                                    | ✓    | Delete entry     |

### Learn

| Method | Endpoint              | Params            | Auth | Description                |
| ------ | --------------------- | ----------------- | ---- | -------------------------- |
| GET    | `/api/learn/articles` | `?page=1&limit=6` | —    | Paginated article list     |
| GET    | `/api/learn/stats`    | —                 | —    | AIHW + ABS open data stats |

---

## 7. Git Branching Standards

```bash
main          # Stable main branch (framework + common code)
feature/welcome-login    # Minyu
feature/dashboard        #
feature/diary            # Minyu
feature/learn            #
feature/profile          # Minyu
```

---

## 8. Security Implementation

| Concern       | Measure                                            | Where                           |
| ------------- | -------------------------------------------------- | ------------------------------- |
| XSS — input   | `sanitize-html` strips all tags on write           | `backend/src/utils/sanitize.js` |
| XSS — output  | `v-text` (not `v-html`) for user content           | All Vue templates               |
| SQL Injection | Parameterised queries (`$1, $2`) everywhere        | All route handlers              |
| Auth          | Session-based (HTTP-only cookie)                   | `express-session`               |
| CSRF          | `sameSite: 'none'` + `credentials: true` CORS      | `app.js`                        |
| Passwords     | bcrypt (salt rounds = 10)                          | `seedDb.js`, `auth.js`          |
| Rate limiting | 10 login attempts / 15 min; 200 API calls / 15 min | `app.js`                        |
| File upload   | Whitelist MIME types, 5 MB max                     | `diary.js` multer config        |
| HTTPS         | Provided by Vercel (frontend) + Render (backend)   | Deployment                      |

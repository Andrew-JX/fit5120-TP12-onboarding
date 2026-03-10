# FIT5120 TP12 — The Generational Shift in Sun-Safety Attitudes

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

# frontend
cd frontend && npm install

# backend
cd ../backend && npm install
```

---

## 2. Configuring Environment Variables

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

## 6. Page Division of Labor

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

## 8. Safety Precautions

- All user input is cleaned on the backend using `sanitize-html` before being stored in the database.

- User input is rendered on the frontend using `v-text` instead of `v-html`.

- All database queries use parameterized queries (`$1, $2`), and string concatenation is prohibited.

- API keys and database connection information are stored in `.env` and have been added to `.gitignore`.

- HTTPS is provided by Vercel/Render by default.

# SunSafe — FIT5120 Team TP12

A web app helping young Australians (Gen Z) understand UV risks and build safer sun protection habits. Built for Monash University FIT5120 Industry Experience, Semester 1 2026.

**Topic:** The Generational Shift in Sun-Safe Attitudes  
**Team:** TP12 — Jiawei Li, Minyu Ji, Jiacheng Gu, Jieyu Fei, Zetong He, Yuxin Wu  
**Stack:** Vue 3 + Node.js/Express + PostgreSQL  
**Repo:** https://github.com/Andrew-JX/fit5120-TP12-onboarding

### Prerequisites

- Node.js >= 18
- PostgreSQL（Render）External Database URL：postgresql://fit5120_tp12_db_user:yrofeVbpitWec97Wt6UmSBqCLJ04voHG@dpg-d6o03b1aae7s73bq6d20-a.singapore-postgres.render.com/fit5120_tp12_db
- Git

---

### 1. Clone and install

```bash
git clone https://github.com/Andrew-JX/fit5120-TP12-onboarding.git
cd fit5120-TP12-onboarding

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment variables

```bash
# Backend
cd backend
cp .env.example .env
# Fill in DATABASE_URL, SESSION_SECRET, OPENWEATHER_API_KEY, FRONTEND_URL

# Frontend
cd ../frontend
cp .env.example .env
# Leave VITE_API_URL empty for local dev (Vite proxy handles it)
# Set VITE_API_URL=https://your-backend.onrender.com for production
```

### 3. Set up the database

```bash
cd backend
npm run db:init    # creates all tables
npm run db:seed    # inserts demo accounts, articles, and open dataset stats
```

### 4. Run locally

```bash
# Terminal 1
cd backend && npm run dev    # runs on port 3000

# Terminal 2
cd frontend && npm run dev   # runs on port 5173
```

Open http://localhost:5173

Test accounts:

| username | password  |
|----------|-----------|
| demo     | demo123   |
| admin    | admin123  |

---

## API reference

### Auth

| Method | Endpoint | Body | Auth required | Notes |
|--------|----------|------|---------------|-------|
| POST | `/api/auth/login` | `{username, password}` | No | Sets session cookie |
| POST | `/api/auth/logout` | — | Yes | Clears session |
| GET | `/api/auth/me` | — | Yes | Returns current user |

### UV

| Method | Endpoint | Params | Auth required | Notes |
|--------|----------|--------|---------------|-------|
| GET | `/api/uv/current` | `?city=melbourne` | No | Real-time UV, cached 30 min |
| GET | `/api/uv/advice` | `?index=7` | No | Advice for any UV level |
| GET | `/api/uv/locations` | — | No | List of 8 AU cities |
| POST | `/api/uv/log` | `{uvIndex, city}` | Yes | Log exposure entry |
| GET | `/api/uv/history` | — | Yes | Last 7 days for current user |

### Diary

| Method | Endpoint | Body/Params | Auth required | Notes |
|--------|----------|-------------|---------------|-------|
| POST | `/api/diary` | multipart: `photo, bodyPart, notes, entryDate` | Yes | Creates entry |
| GET | `/api/diary` | `?bodyPart=arm&sortBy=date_desc&page=1&limit=10` | Yes | Paginated list |
| GET | `/api/diary/:id` | — | Yes | Single entry |
| DELETE | `/api/diary/:id` | — | Yes | Deletes entry + file |

### Learn

| Method | Endpoint | Params | Auth required | Notes |
|--------|----------|--------|---------------|-------|
| GET | `/api/learn/articles` | `?page=1&limit=6` | No | Paginated articles |
| GET | `/api/learn/stats` | — | No | AIHW incidence + ABS behaviour data |

---

## Page ownership and branches

| Page | File | Owner | Branch |
|------|------|-------|--------|
| Login | WelcomeView.vue | Minyu Ji | feature/welcome-login |
| Dashboard | DashboardView.vue | Teammate | feature/dashboard |
| Diary | DiaryView.vue | Minyu Ji | feature/diary |
| Learn | LearnView.vue | Teammate | feature/learn |
| Profile | ProfileView.vue | Minyu Ji | feature/profile |

Branch workflow:

```bash
git checkout main && git pull origin main
git checkout -b feature/your-page
# work on your view file only
git push origin feature/your-page
# open a pull request to main on GitHub
```

---

## Security

| Concern | Implementation |
|---------|----------------|
| XSS — input | `sanitize-html` strips all tags before DB write (`utils/sanitize.js`) |
| XSS — output | `v-text` instead of `v-html` in all Vue templates that render user content |
| SQL injection | Parameterised queries (`$1, $2`) in every route handler — no string concatenation |
| Authentication | Session cookie (`httpOnly: true`, bcrypt password hashing) |
| Rate limiting | 10 login attempts per 15 min; 200 API requests per 15 min |
| File upload | MIME type whitelist (jpg/png/webp), 5 MB size limit |
| HTTPS | Provided automatically by Vercel (frontend) and Render (backend) |

---

## Deployment
https://fit5120-tp-12-onboarding-i7v5.vercel.app/


## Links

- Leankit: https://monashie.leankit.com/board/2426778180
- PGP (Google Drive): https://drive.google.com/drive/folders/1Rhm422JYTam-Lr5h0qwy3aLxJ_W2sxqb

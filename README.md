# NutriAi 🍛

> An AI-powered full-stack nutrition tracking web app built for college students — log meals, track macros, classify food from photos, and share your progress.

---

## Overview

NutriAi is a production-grade nutrition assistant that combines a clean, minimal React frontend with a Node.js backend, PostgreSQL database, and a Python FastAPI ML service. Users can log meals by searching or snapping a photo, track daily calories and macros, and get personalized nutrition plans based on their body stats and goals.

The app is designed to feel like a native mobile app — it runs in a phone-shaped card in the browser, has a bottom navigation bar, and supports both dark and light themes.

---

## Features

### Auth
- Email/password signup with email verification (Resend)
- JWT authentication via httpOnly cookies (not localStorage)
- Forgot password and reset password flow
- Session persistence across page refreshes

### Onboarding (7 steps)
- Gender, age, height, weight
- Fitness goal (lose weight / gain weight / build muscle / maintain)
- Activity level
- Target weight
- Timeline with **realistic goal validation** — warns if goal exceeds safe weekly rate (0.75kg/week loss, 0.6kg/week gain)
- Meals per day with custom meal slot naming
- Personalized daily calorie and macro targets computed automatically

### Dashboard
- Calorie ring showing consumed vs remaining
- Macro bars — protein, carbs, fat
- Week strip date picker — navigate back/forward by week
- Meal log grouped by slot (Breakfast, Lunch, Dinner, Snack, Custom)
- Add meals by text search or camera
- Delete meal entries
- Real-time totals update

### Camera / AI Food Classification
- Snap a meal photo → ConvNeXt Tiny model identifies the food
- Shows confidence percentage
- If uncertain (< 40%) — shows top 3 predictions to pick from
- Quantity selector with unit conversion (pieces, grams, cups, tbsp, tsp)
- Meal type selector before logging
- 30 second timeout if ML service is unavailable

### Progress
- Daily / Weekly / Monthly analytics
- Calories and macro breakdown for each period
- Generate shareable public links — anyone with the link can view your progress
- Links expire after 7 days
- Max 5 active links per user
- Delete links anytime

### Profile
- Avatar with name initial
- Daily targets grid (calories, protein, carbs, fat)
- Body stats (age, height, weight, target weight, goal, activity)
- BMI card
- Dark / light theme toggle
- Sign out

### Public Share Page
- `/share/:token` — publicly accessible, no login needed
- Shows nutrition stats for the selected period
- Safe — token is 64 hex characters, impossible to guess

---

## Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Routing | React Router v6 |
| Styling | Inline styles, no UI library |
| Font | DM Sans + Inter (Google Fonts) |
| Auth | JWT via httpOnly cookies |
| State | React useState / useContext |
| Error handling | React ErrorBoundary |

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js + Express (ES Modules) |
| Database | PostgreSQL on Neon (serverless) |
| Auth | JWT + bcrypt |
| Email | Resend API |
| Security | helmet, express-rate-limit, CORS |
| DB Client | pg (node-postgres) with connection pooling |

### ML Service
| Layer | Technology |
|---|---|
| Framework | FastAPI + Uvicorn |
| Model | ConvNeXt Tiny (PyTorch + timm) |
| Nutrition Lookup | 5-layer pipeline — Cache → DB → Fuzzy → Dual LLM → Gemini fallback |
| LLMs | Qwen 72B + Mixtral 8x7B via HuggingFace |
| OCR | Google Cloud Vision API + Tesseract fallback |
| Agents | LangGraph (onboarding, gap analysis, weekly review) |
| Chatbot | LangChain + LangGraph + ChromaDB RAG |

---

## Project Structure

```
25-02-26-MERN-Auth/
├── .env                          ← root environment variables
├── package.json                  ← "dev": "nodemon backend/index.js"
│
├── backend/
│   ├── index.js                  ← Express app, all routes registered
│   ├── controllers/
│   │   ├── auth-controller.js
│   │   ├── profile-controller.js
│   │   ├── nutrition-controller.js
│   │   ├── foodLog-controller.js
│   │   └── share-controller.js
│   ├── routes/
│   │   ├── auth-route.js
│   │   ├── profile-route.js
│   │   ├── nutrition-route.js
│   │   ├── foodLog-route.js
│   │   └── share-route.js
│   ├── middleware/
│   │   ├── verifyToken.js
│   │   └── requireOnboarding.js
│   ├── model/
│   │   ├── user.js
│   │   └── foodLog.js
│   ├── database/
│   │   ├── connectionToDatabase.js
│   │   └── schema.sql
│   ├── resend/
│   │   ├── config.js
│   │   ├── email.js
│   │   └── email-template.js
│   └── utils/
│       ├── generateJWTToken.js
│       └── generateVerificationToken.js
│
├── frontend/
│   ├── public/
│   │   └── nutriai-icon.svg
│   ├── src/
│   │   └── App.jsx               ← entire React app
│   ├── index.html
│   ├── vite.config.js
│   ├── vercel.json               ← SPA routing for Vercel
│   └── package.json
│
└── ml-services/
    ├── main.py                   ← FastAPI — all endpoints
    ├── classifier.py             ← ConvNeXt Tiny inference
    ├── nutrition.py              ← 5-layer nutrition lookup
    ├── nutrition_db.py           ← 500+ Indian dishes database
    ├── ocr.py                    ← Google Vision + Tesseract OCR
    ├── agent.py                  ← LangGraph agents
    ├── chatbot.py                ← Context-aware chatbot
    ├── rag.py                    ← ChromaDB RAG pipeline
    ├── database.py               ← Async PostgreSQL (psycopg3)
    ├── convnext_tiny_best.pth    ← Model weights (not in repo)
    └── requirements.txt
```

---

## Database Schema

### users
Stores user profile, body stats, and computed nutrition targets.
```
id, name, email, password, is_verified, age, height_cm, weight_kg,
gender, goal, activity_level, target_weight_kg, is_onboarded,
target_calories, target_protein_g, target_carbs_g, target_fat_g,
meals_per_day, custom_meal_name, duration_weeks, created_at, updated_at
```

### food_logs
One row per logged meal item per user per day.
```
id, user_id (FK), dish_name, meal_type, portion_g,
calories, protein_g, carbs_g, fat_g, logged_via, image_url, log_date
```

### shared_links
Public share tokens for the progress sharing feature.
```
id (UUID), user_id (FK), token (64 hex chars), period, created_at, expires_at
```

### mess_menu (ML service)
Stores mess menu dishes after OCR scan — used by chatbot and gap analysis.
```
id, institution_id, meal_slot, dish_key, display_name,
calories, protein_g, carbs_g, fats_g, serving_desc, portion_g, created_at
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL (or Neon free tier)
- Tesseract binary (optional — only for OCR fallback)

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/nutriai.git
cd nutriai
```

### 2. Backend setup
```bash
npm install
```

Create `.env` in the root:
```env
DATABASE_URL=postgresql://user:password@host/db?sslmode=require
JWT_SECRET=your_long_random_secret_here
RESEND_API_KEY=re_xxxx
CLIENT_URL=http://localhost:5173
ML_SERVICE_URL=http://localhost:8000
HF_API_KEY=hf_xxxx
NODE_ENV=development
```

Generate a strong JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Frontend setup
```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:3000
VITE_ML_URL=http://localhost:8000
```

### 4. ML service setup
```bash
cd ml-services
pip install -r requirements.txt --break-system-packages
```

Add to root `.env`:
```env
GOOGLE_VISION_API_KEY=AIza_xxxx
GEMINI_API_KEY=your_key
LANGSMITH_API_KEY=your_key  # optional
```

Place model weights in `ml-services/`:
```
convnext_tiny_best.pth
```

### 5. Run everything

Terminal 1 — Backend:
```bash
npm run dev
```

Terminal 2 — Frontend:
```bash
cd frontend
npm run dev
```

Terminal 3 — ML service:
```bash
cd ml-services
uvicorn main:app --reload --port 8000
```

Open `http://localhost:5173`

---

## API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/signup` | Register new user |
| POST | `/login` | Login |
| POST | `/logout` | Logout |
| POST | `/verify-email` | Verify email token |
| POST | `/forgot-password` | Send reset email |
| POST | `/reset-password/:token` | Reset password |
| GET | `/check-auth` | Verify session |

### Profile (`/api/profile`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Fetch profile + targets |
| POST | `/onboarding` | Complete onboarding |

### Food Log (`/api/food-log`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Log a meal |
| GET | `/dashboard` | Get logs for a date |
| DELETE | `/:id` | Delete a log entry |

### Share (`/api/share`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/stats` | Get stats for a period |
| GET | `/links` | Get all active links |
| POST | `/generate` | Generate share link |
| DELETE | `/:token` | Delete a link |
| GET | `/view/:token` | Public — view shared progress |

### ML Service (port 8000)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/classify` | Image → dish + nutrition |
| POST | `/nutrition` | Dish name → nutrition |
| POST | `/ocr/scan` | Menu photo → matched dishes |
| POST | `/ocr/save-menu` | Save confirmed menu |
| POST | `/chat` | Chatbot message |
| POST | `/chat/stream` | Streaming chatbot response |
| GET | `/health` | Service health check |

---

## Security

- JWT stored in **httpOnly cookies** — not accessible from JavaScript
- **helmet** — sets XSS, HSTS, clickjacking, MIME sniffing protection headers
- **Rate limiting** — 100 req/15min on auth routes in production, 200 globally
- **CORS** — restricted to `CLIENT_URL` env variable
- **Input validation** — maxLength on all inputs, file type and size checks on uploads
- **Share tokens** — 64-character cryptographically random hex, expires in 7 days
- **SQL injection** — all queries use parameterized statements
- **Session handling** — 401 on protected routes redirects to login without loop

---

## Deployment

### Frontend → Vercel
1. Push `frontend/` to GitHub
2. Import on vercel.com
3. Set root directory to `frontend`
4. Add env vars: `VITE_API_URL`, `VITE_ML_URL`
5. Deploy

### Backend → Render / Railway
1. Set all env vars in dashboard
2. Start command: `node backend/index.js`
3. Update `CLIENT_URL` to your Vercel domain

### ML Service → Railway / Render
1. Set `HF_API_KEY`, `DATABASE_URL`, `GOOGLE_VISION_API_KEY`
2. Start command: `uvicorn main:app --host 0.0.0.0 --port 8000`
3. Upload model weights separately (too large for git)

---

## Environment Variables Reference

| Variable | Used by | Description |
|---|---|---|
| `DATABASE_URL` | Backend + ML | Neon PostgreSQL connection string |
| `JWT_SECRET` | Backend | Secret for signing JWT tokens |
| `RESEND_API_KEY` | Backend | Email sending via Resend |
| `CLIENT_URL` | Backend | Frontend URL for CORS + email links |
| `ML_SERVICE_URL` | Backend | ML FastAPI service URL |
| `HF_API_KEY` | ML | HuggingFace API for LLM nutrition lookup |
| `GOOGLE_VISION_API_KEY` | ML | Google Cloud Vision for OCR |
| `GEMINI_API_KEY` | ML | Gemini fallback for nutrition lookup |
| `LANGSMITH_API_KEY` | ML | LangSmith observability (optional) |
| `VITE_API_URL` | Frontend | Backend URL |
| `VITE_ML_URL` | Frontend | ML service URL |
| `NODE_ENV` | Backend | `development` or `production` |

---

## License

MIT

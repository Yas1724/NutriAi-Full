import express from 'express';
import { connectToDatabase } from './database/connectionToDatabase.js';
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes      from './routes/auth-route.js';
import profileRoutes   from './routes/profile-route.js';
import nutritionRoutes from './routes/nutrition-route.js';
import foodLogRoutes   from './routes/foodLog-route.js';
import shareRoutes     from './routes/share-route.js';
import chatRoutes      from './routes/chat-route.js';
import agentRoutes     from './routes/agent-route.js';
import reviewRoutes    from './routes/review-route.js';

dotenv.config();

const app = express();

app.use(helmet());

app.use(cors({
  origin: process.env.CLIENT_URL || 'https://nutriai-frontend-xi.vercel.app/',
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

if (process.env.NODE_ENV === "production") {
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, max: 200,
    standardHeaders: true, legacyHeaders: false,
    message: { success: false, message: "Too many requests, please try again later." },
  });
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, max: 100,
    standardHeaders: true, legacyHeaders: false,
    message: { success: false, message: "Too many attempts, please try again in 15 minutes." },
  });
  app.use(globalLimiter);
  app.use('/api/auth/login',           authLimiter);
  app.use('/api/auth/signup',          authLimiter);
  app.use('/api/auth/forgot-password', authLimiter);
  app.use('/api/auth/reset-password',  authLimiter);
  app.use('/api/auth/verify-email',    authLimiter);
}

app.use('/api/auth',      authRoutes);
app.use('/api/profile',   profileRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/food-log',  foodLogRoutes);
app.use('/api/share',     shareRoutes);
app.use('/api/chat',      chatRoutes);
app.use('/api/agent',     agentRoutes);
app.use('/api/review',    reviewRoutes);

app.get('/', (req, res) => res.json({ status: "NutriAi API running" }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Internal server error" });
});

connectToDatabase()
  .then(() => {
    app.listen(process.env.PORT || 3000, () =>
      console.log(`Server running on port ${process.env.PORT || 3000}`)
    );
  })
  .catch(err => {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  });
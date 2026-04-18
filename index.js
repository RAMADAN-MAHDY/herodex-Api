import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { notFound, errorHandler } from './src/middlewares/errorMiddleware.js';


import authRoutes from './src/routes/authRoutes.js';
import categoryRoutes from './src/routes/categoryRoutes.js';
import productRoutes from './src/routes/productRoutes.js';
import reviewRoutes from './src/routes/reviewRoutes.js';
import statsRoutes from './src/routes/statsRoutes.js';
import cartRoutes from './src/routes/cartRoutes.js';
import orderRoutes from './src/routes/orderRoutes.js';
import { initTelegramBot } from './src/utils/telegram.service.js';

dotenv.config();


const app = express();

app.set('trust proxy', 1);

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://i.ibb.co", "https://*.googleusercontent.com"],
      connectSrc: ["'self'", "https://accounts.google.com", "https://oauth2.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  xFrameOptions: { action: "deny" },
  xContentTypeOptions: true,
  xssFilter: true,
  referrerPolicy: { policy: "no-referrer" },
}));

// cors
const corsOptions = {
  origin: ["http://localhost:3000", "https://herodex-navy.vercel.app", "https://herodex-git-test-kharjclean-8981s-projects.vercel.app"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// Fix: Initialize Bot BEFORE error middlewares
if (process.env.NODE_ENV !== 'test') {
  initTelegramBot(app);
}

// Root route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(MONGO_URI)
    .then(() => {
      console.log('✅ MongoDB Connected');
      if (process.env.NODE_ENV !== 'production') {
        app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
      }
    })
    .catch((err) => {
      console.error(`❌ MongoDB Connection Error: ${err.message}`);
      if (process.env.NODE_ENV === 'production') process.exit(1);
    });
}

export default app;

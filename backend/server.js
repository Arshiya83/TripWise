
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import tripRoutes from './routes/tripRoutes.js';
import routeRoutes from './routes/routeRoutes.js';
import hotelRoutes from './routes/hotelRoutes.js';
import restaurantRoutes from './routes/restaurantRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration supporting local dev and production frontend deployment
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server health checks)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.onrender.com') ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Fallback for public sharing
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Authentication Routes
app.use('/api/auth', authRoutes);

// Trip Routes
app.use('/api/trips', tripRoutes);

// Route Calculation Routes
app.use('/api/route', routeRoutes);

// Hotel & Accommodation Routes
app.use('/api/hotels', hotelRoutes);

// Restaurant & Culinary Routes
app.use('/api/restaurants', restaurantRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(200).json({
    status: 'ok',
    message: 'TripWise backend is running',
    database: isDbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);

  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
  });
});

// Connect to MongoDB and start the server
async function startServer() {
  try {
    await connectDB();
  } catch (error) {
    console.error(
      '[TripWise Backend] Warning - Initial MongoDB connection failed:',
      error.message
    );
    // Periodically retry connecting until successful
    const retryTimer = setInterval(async () => {
      if (mongoose.connection.readyState === 1) {
        clearInterval(retryTimer);
        return;
      }
      try {
        await connectDB();
        console.log('[TripWise Backend] Successfully reconnected to MongoDB Atlas.');
        clearInterval(retryTimer);
      } catch {
        // Will retry on next interval
      }
    }, 4000);
  }

  app.listen(PORT, () => {
    console.log(
      `[TripWise Backend] Server running on http://localhost:${PORT}`
    );

    console.log(
      `[TripWise Backend] Health check endpoint: http://localhost:${PORT}/api/health`
    );

    console.log(
      `[TripWise Backend] Authentication endpoint: http://localhost:${PORT}/api/auth`
    );

    console.log(
      `[TripWise Backend] Trips endpoint: http://localhost:${PORT}/api/trips`
    );
  });
}

startServer();

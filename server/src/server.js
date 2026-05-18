import dotenv from "dotenv";
dotenv.config();
import express from 'express';
import cors    from 'cors';
import helmet  from 'helmet';
import mongoose from 'mongoose';

import connectDB        from './config/db.js';
import errorHandler     from './middlewares/errorHandler.js';

import healthRoutes     from './routes/healthRoutes.js';
import authRoutes       from './routes/authRoutes.js';
import userRoutes       from './routes/userRoutes.js';
import productRoutes    from './routes/productRoutes.js';
import customerRoutes   from './routes/customerRoutes.js';
import orderRoutes      from './routes/orderRoutes.js';
import stockRoutes      from './routes/stockRoutes.js';
import deliveryRoutes   from './routes/deliveryRoutes.js';
import paymentRoutes    from './routes/paymentRoutes.js';   
import ensureAdminUser  from './utils/bootstrapAdmin.js';
import reportsRoutes from "./routes/reportsRoutes.js";

const app = express();

const getDatabaseStatus = () => {
  switch (mongoose.connection.readyState) {
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    case 3:
      return 'disconnecting';
    default:
      return 'disconnected';
  }
};

const buildHealthPayload = () => ({
  success: true,
  message: 'WMS Backend is working',
  timestamp: new Date().toISOString(),
  database: getDatabaseStatus(),
});

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_2,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));
app.use(helmet());
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'WMS Backend is running',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.status(200).json(buildHealthPayload());
});

app.get('/api/health', (req, res) => {
  res.status(200).json(buildHealthPayload());
});

app.use('/api/health',     healthRoutes);
app.use('/api/auth',       authRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/products',   productRoutes);
app.use('/api/customers',  customerRoutes);
app.use('/api/orders',     orderRoutes);
app.use('/api/stock',      stockRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/payments',   paymentRoutes); 
app.use("/api/reports", reportsRoutes);  


app.use(errorHandler);
const PORT = process.env.PORT || 5000;

const initializeServices = async () => {
  const isDatabaseConnected = await connectDB();
  if (!isDatabaseConnected) {
    console.warn('Server is running without a database connection.');
    return;
  }

  try {
    await ensureAdminUser();
  } catch (error) {
    console.error('Admin bootstrap failed:', error);
  }
};

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

initializeServices().catch((error) => {
  console.error('Background initialization failed:', error);
});

import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Standard Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Replicate Laravel's storage link so "/storage" serves the files in storage/app/public
const storagePath = path.resolve(process.cwd(), '../storage/app/public');
app.use('/storage', express.static(storagePath));

// API Routes
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);

// Root Hello Endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Sapulidiku JavaScript API Backend',
    version: '1.0.0',
    status: 'Running',
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Sapulidiku Express server is listening on http://127.0.0.1:${PORT}`);
});

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import customerRoutes from './routes/customers.js';
import segmentRoutes from './routes/segments.js';
import interactionRoutes from './routes/interactions.js';
import supportRoutes from './routes/support.js';
import statsRoutes from './routes/stats.js';
import activityRoutes from './routes/activities.js';
import dealRoutes from './routes/deals.js';


// Setup for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file located in the same directory
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const port = 3001;

// Middlewares
app.use(cors());
app.use(express.json()); // This is crucial for parsing JSON request bodies

// Use the routes
app.use('/api/customers', customerRoutes);
app.use('/api/segments', segmentRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/stats', statsRoutes);
app.use(activityRoutes);
app.use('/api/deals', dealRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});


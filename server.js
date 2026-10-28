import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { hospitalPool } from './config/db.js';
import helloWorldRouter from './modules/helloworld/routes.js';
import { requestId } from './middleware/requestId.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import hospitalRouter from './modules/hospital/routes.js';

dotenv.config({ quiet: true });

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestId);

// Health check
app.get('/health', async (req, res) => {
  await hospitalPool.query('SELECT 1');
  res.json({ status: 'ok', database: 'connected' });
});

// Mount Routes
app.use('/v1/hello-world', helloWorldRouter);
app.use('/v1/hospital', hospitalRouter);

// Centralized error handling (must be mounted last)
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
});

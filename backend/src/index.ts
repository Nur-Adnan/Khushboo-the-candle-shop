import dotenv from 'dotenv';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { authRouter } from './routes/auth';
import { analyticsRouter } from './routes/analytics';
import { categoriesRouter } from './routes/categories';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimit';
import { productsRouter } from './routes/products';
import { requestLogger } from './services/logger';
import { searchRouter } from './routes/search';

dotenv.config({ quiet: true });

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
  }),
);
app.use(requestLogger);
app.use(apiLimiter);
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/categories', categoriesRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/analytics', analyticsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`KHUSBOOO API listening on port ${port}`);
});

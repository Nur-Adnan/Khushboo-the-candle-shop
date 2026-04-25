import dotenv from 'dotenv';
import express from 'express';

import { authRouter } from './routes/auth';

dotenv.config({ quiet: true });

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/v1/auth', authRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({
    error: true,
    message: 'Something went wrong',
    code: 'SERVER_ERROR',
  });
});

app.listen(port, () => {
  console.log(`KHUSBOOO API listening on port ${port}`);
});

import dotenv from 'dotenv';
import express from 'express';

dotenv.config({ quiet: true });

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`KHUSBOOO API listening on port ${port}`);
});

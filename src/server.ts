import { createApp } from './app.ts';
import { getDifficulty } from './config.ts';

const PORT = Number(process.env.PORT) || 3000;

createApp().listen(PORT, () => {
  console.log(`Coffee ledger API listening on http://localhost:${PORT}`);
  console.log(`Proof-of-Work difficulty: ${getDifficulty()}`);
});

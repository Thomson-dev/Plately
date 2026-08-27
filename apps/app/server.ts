import app from './src/app';
import { connectDB } from './src/config/db';
import { env } from './src/config/env';

async function start(): Promise<void> {
  await connectDB();
  app.listen(env.port, () => {
    console.log(`auth-service listening on port ${env.port}`);
  });
}

start();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

const ollamaUrl =
  process.env.OLLAMA_URL || 'http://localhost:11434';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for Vue + Vite
  app.enableCors({
    origin: ollamaUrl,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();

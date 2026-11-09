import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { OllamaApiController } from './ollama-api/ollama-api.controller.js';
import { OllamaApiService } from './ollama-api/ollama-api.service.js';
import { OllamaApiModule } from './ollama-api/ollama-api.module.js';

@Module({
  imports: [OllamaApiModule],
  controllers: [AppController, OllamaApiController],
  providers: [AppService, OllamaApiService],
})
export class AppModule {}

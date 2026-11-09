import { Module } from '@nestjs/common';
import { OllamaApiService } from './ollama-api.service.js';
import { OllamaApiController } from './ollama-api.controller.js';

@Module({
    providers: [OllamaApiService],
    controllers: [OllamaApiController]
})
export class OllamaApiModule {}

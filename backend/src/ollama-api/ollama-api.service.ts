import { Injectable } from '@nestjs/common';

@Injectable()
export class OllamaApiService {
    getStatus() {
        return { status: 'OK' };
    }
}

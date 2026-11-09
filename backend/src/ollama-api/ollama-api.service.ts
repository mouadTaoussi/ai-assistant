import { Injectable } from '@nestjs/common';

class ChatDto {
	readonly model: string;
	readonly message: any;
}

@Injectable()
export class OllamaApiService {
    getStatus() {
        return { status: 'OK' };
    }

    chat(model: string, body: ChatDto): any {
        // fetch(`https://localhost:11434/api`, {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify({ model, message: 'Hello, how can I help you today?' })
        // });
        return { model, message: 'Hello, how can I help you today?' };
    }
}

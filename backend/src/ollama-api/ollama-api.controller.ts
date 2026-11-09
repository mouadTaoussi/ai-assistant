import { Controller, Get, Param, Post, Body, HttpCode, Req, Res } from '@nestjs/common';
import { OllamaApiService } from './ollama-api.service.js';

const ollamaUrl =
  process.env.OLLAMA_URL || 'http://localhost:11434';

class ChatDto {
	readonly message: string;
	readonly messages: { role: string; content: string }[];
	readonly stream?: boolean;
}

@Controller('ollama')
export class OllamaApiController {
	constructor(private readonly ollamaApiService: OllamaApiService) {}

	@Post(':model/chat')
	@HttpCode(200)
	async chat(@Param('model') model: string, @Body() body: ChatDto, @Res() res: any): Promise<any> {

		// Tell the browser that we are sending text progressively
		res.setHeader('Content-Type', 'text/plain; charset=utf-8');
		res.setHeader('Cache-Control', 'no-cache, no-transform');
		res.setHeader('Connection', 'keep-alive');
		res.setHeader('X-Accel-Buffering', 'no');

		// Allow cancellation if the client disconnects
		const abortController = new AbortController();

		res.on('close', () => {
			abortController.abort();
		});

		try {
			// Prepare the context for the assistant's response
			const context = `
				You are a helpful assistant. Please respond to the following message from the user:
				${body.message}
				This is the conversation history parsed as JSON:
				${JSON.stringify(body.messages)}
			`
			// Here are some guidelines for your response:
			// - Always provide a detailed response to the user.
			// - Always ask questions at the end to encourage the user to continue the conversation.
			// - If you don't know the answer, say "I don't know" and ask a follow-up question.
			console.log('Context for assistant:', context);
			
			// Send a request to the Ollama API to get the assistant's response
			const response = await fetch(`${ollamaUrl}/api/chat`, {
				method: 'POST',
				signal: abortController.signal,
				headers: { 'Content-Type': 'application/json',"allow-origin": "*","allow-control-allow-origin": "*" },
				body: JSON.stringify({
					model: model,
					messages: [{
							role: "user", 
							content: context
						}],
					stream: body.stream || true,
				}),
			})

			if (!response.ok) res.status(response.status).send(await response.text());
			if (!response.body) {
				res.status(500).send('No response body from Ollama API');
				return;
			}

			// Stream the response from the Ollama API to the client
			const reader = response.body.getReader();
			const decoder = new TextDecoder('utf-8');

			// Read the response stream and send it to the client
			while (true) {

				const { done, value } = await reader.read();

				if (done) break;

				const chunk = decoder.decode(value, { stream: true });
				
				res.write(chunk);
			}

			// End the response when the stream is finished
			res.end();

		}
		catch (error) {
			// console.error('Error in chat method:', error);
			if (!res.writableEnded && !abortController.signal.aborted) {
				res.status(500).end();
			}
		}
	}
}

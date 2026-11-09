<script setup>
// import { INITIAL } from 'shiki/textmate';
import { ref, toValue, computed, watch } from 'vue'
import {marked} from 'marked';

// Streaming Done
// Status Done
// Cancellation Done
// Conversation history Done
const status = ref(false)
const busy = ref(false)
const conversationHistory = ref(window.localStorage.getItem('conversationHistory') ? JSON.parse(window.localStorage.getItem('conversationHistory')) : [])
const messages = ref([])
const model = ref('gemma2:2b')
const apiBaseUrl = 'http://localhost:11434/api'
const responseStream = ref("")
const controller = new AbortController();

const chatContainer = ref(null)

// sCroll to the bottom of the conversation history when a new message is added
function scrollToBottom() {
	requestAnimationFrame(() => {
		const container = chatContainer.value
		if (container) {
			container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
		}
	})
}
watch([conversationHistory, responseStream], scrollToBottom, { deep: true })


async function onSubmit() {
	// add a check to see if the message is empty or only whitespace
	if (!messages.value.trim()) {
		return
	}

	// Handle form submission
	try {
		// Update status to indicate submission is in progress
		status.value = 'Thinking...'
		busy.value = true
		responseStream.value = ""

		// Update the conversation history with the user's message in the local storage
		conversationHistory.value.push({
			role: 'user',
			content: messages.value,
		})
		window.localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory.value))
		
		let message = messages.value;
		messages.value = ''

		// Send a request to the Ollama API to get the assistant's response
		const response = await fetch(`/api/ollama/${model.value}/chat`, {
			method: 'POST',
			signal: controller.signal,
			headers: { 
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				message: message,
				messages: conversationHistory.value,
				stream: true,
			}),
		})
		

		if (!response.ok) throw new Error(`Ollama request failed (${response.status})`)
		if (!response.body) throw new Error('Ollama did not provide a response stream.')
		
		// Ollama streams newline-delimited JSON; chunks may end mid-line, so buffer them.
		const reader = response.body.getReader()
		const decoder = new TextDecoder()
		status.value = 'Receiving response...'

		// WHAT'S NEXT ?
		// let buffer = [" "]
		// Read the stream and process each chunk of data based on buffer limites to 5 caracters, 
		// then append to responseStream.value
		while (true) {
			const { done, value } = await reader.read()
			if (done) break
			const chunk = decoder.decode(value, { stream: true })
			// Process the chunk of data here
			// if (buffer.length < 5) {
			// 	buffer.push(JSON.parse(chunk).message.content)
			// }
			// else if (buffer.length === 5) {
			// 	responseStream.value += buffer.join('')
			// 	buffer = [" "];
			// 	console.log("buffer")
			// }
			// console.log(buffer)

			responseStream.value += JSON.parse(chunk).message.content
		}
		// Process any remaining data in the buffer
		// if (buffer.length > 0) {
			// responseStream.value += buffer.join('')
		// }

		// Update the conversation history with the assistant's response in the local storage
		conversationHistory.value.push({
			role: 'assistant',
			content: responseStream.value,
		})
		window.localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory.value))

		status.value = 'Done!'
		busy.value = false

	} catch (error) {
		// Handle any errors that occur during submission
		status.value = `Error: ${error.message}`
	}
}

const toMarkdown = computed(() => {
	// Convert the response stream to HTML using marked
	return marked.parse(responseStream.value)
})

async function copyText(message, content) {
	await navigator.clipboard.writeText(message.content)
}

function deleteMessage(index) {
	conversationHistory.value.splice(index, 1); 
	window.localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory.value))
}

function onCancel() {
	// Handle cancellation of the submission
	controller.abort()
	status.value = 'Generating cancelled.'
	busy.value = false
}


defineProps({
	msg: {
		type: String,
		default: 'Hello Vue!',
	},
})

const count = ref(0)
</script>

<template>
	<div class="chatpage">
		<!-- <section class="sidebar">
			<h2>Sidebar</h2>
			<p>This is the sidebar content.</p>
		</section> -->
		<section class="hello-world" ref="chatContainer">
			<div class="conversation-history" v-if="conversationHistory.length > 0">
				<p v-for="(message, index) in conversationHistory" :key="index">
					<div v-if="message.role === 'user'" class="user-message">
						<strong>{{ "You" }}:</strong> <span v-html="marked.parse(message.content)"></span>
					</div>
					<div v-else class="assistant-message">
						<strong>{{ "Assistant" }}:</strong> <span v-html="marked.parse(message.content)"></span>
						<div>
							<button class="copy-btn" @click="copyText(message,content)">Copy</button>
							<button class="delete-btn" @click="deleteMessage(index)">Delete</button>
						</div>
					</div>
				</p>
				<div class="status" v-if="busy && status == 'Thinking...'">
					<!--By Sam Herbert (@sherb), for everyone. More @ http://goo.gl/7AJzbL--><!--Todo: add easing-->
					<svg
						viewBox="0 0 57 60"
						xmlns="http://www.w3.org/2000/svg"
						stroke="white"
					>
						<g fill="none" fill-rule="evenodd">
							<g transform="translate(1 1)" stroke-width="3">
								<circle cx="5" cy="50" r="5">
									<animate
										attributeName="cy"
										begin="0s"
										dur="2.8s"
										values="50;5;50;50"
										calcMode="linear"
										repeatCount="indefinite"
									/>
									<animate
										attributeName="cx"
										begin="0s"
										dur="2.8s"
										values="5;27;49;5"
										calcMode="linear"
										repeatCount="indefinite"
									/>
								</circle>
								<circle cx="27" cy="5" r="5">
									<animate
										attributeName="cy"
										begin="0s"
										dur="2.8s"
										from="5"
										to="5"
										values="5;50;50;5"
										calcMode="linear"
										repeatCount="indefinite"
									/>
									<animate
										attributeName="cx"
										begin="0s"
										dur="2.8s"
										from="27"
										to="27"
										values="27;49;5;27"
										calcMode="linear"
										repeatCount="indefinite"
									/>
								</circle>
								<circle cx="49" cy="50" r="5">
									<animate
										attributeName="cy"
										begin="0s"
										dur="2.8s"
										values="50;50;5;50"
										calcMode="linear"
										repeatCount="indefinite"
									/>
									<animate
										attributeName="cx"
										from="49"
										to="49"
										begin="0s"
										dur="2.8s"
										values="49;5;27;49"
										calcMode="linear"
										repeatCount="indefinite"
									/>
								</circle>
							</g>
						</g>
					</svg>
				</div>
				<!-- Streamed Response -->
				<div v-if="responseStream && busy" style="padding: 0.5rem 1rem;">
					<strong >Assistant:</strong>
				</div>
				<div v-if="responseStream && busy" v-html="toMarkdown" class="assistant-message"></div>
			</div>
			
			<div class="form-group">
				<input class="form-control message" v-on:keydown.enter="onSubmit" v-model="messages" type="text" placeholder="Enter your message..." />
				<select class="form-control model" v-model="model" :disabled="busy">
					<option value="gemma2:2b">gemma2:2b</option>
					<option value="phi4-mini">phi4-mini</option>
					<option value="llama3">llama3</option>
				</select>
				<button class="submit-btn" v-if="!busy" type="button" @click="onSubmit" :disabled="busy">
					Submit
				</button>
				<button class="cancel-btn" v-else-if="busy" type="button" @click="onCancel" :disabled="!busy">
					Cancel
				</button>
			</div>
		</section>
	</div>
</template>

<style scoped>
@import "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&amp;display=swap";

* {
    font-family:
    "Inter", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol",
    "Noto Color Emoji";
	font-size: 1.25rem;
}
.chatpage {
	/* display: grid;
	grid-template-columns: 1fr 3fr;
	gap: 1rem; */
	display: flex;
	width: 100%;
	min-height: 100vh;
}
.sidebar {
	background-color: #1e1e1e;
	padding: 1rem;
	color: white;
}
/* Page Layout */
.hello-world {
	background-color: black;
	display: grid;
	justify-items: center;
	gap: 1rem;
	width: 100%;
	height: 100vh;
	overflow-y: scroll;
	scroll-behavior: smooth;
}
.status {
	width: 2.5rem;
	height: 2.5rem;
}
/* Conversation History */
.conversation-history {
	width: 60%;
	padding: 1rem;
	border-radius: 1.5rem;
	color: white;
	line-height: 2.5rem;
	margin-bottom: 200px;
}
.user-message {
	background-color: #e0f7fa;
	background-color: rgb(37, 37, 37);
	padding: 0.5rem 1rem;
	border-radius: 1.5rem;
	margin-bottom: 1.25rem;
	text-align: right;
}
.assistant-message {
	padding: 0.5rem 1rem;
	border-radius: 1.5rem;
	margin-bottom: 1.25rem;
	text-align: left;
}
/* markdown styling */
table {
	border-collapse: collapse;
	width: 100%;

}
th, td {
	border: 1px solid #ddd;
	padding: 8px;
}
a {
	color:rgb(0, 0, 251)
}
code {
	background-color: gray;
}
/* Form Controls */
.form-group {
	background-color: black;
	border-radius: 1.5rem;
	border: 1px solid #ccc;
	width: 60%;
	height: 5rem;
	display: flex;
	gap: 0.5rem;
	position: fixed;
	bottom: 2rem;
	z-index: 100;
	padding: 0.5rem;
	margin: 2rem 1rem ;
	/* color: white; */
}
.form-control.message {
	flex: 1;
	color: white;
}
.form-control.model {
	width: 170px;
	color: white;
	background-color: black;
}
.copy-btn, .delete-btn {
	cursor: pointer;
	color: grey;
	margin-right: 0.5rem;
	font-size: 0.75rem;
}
.submit-btn {
	cursor: pointer;
	background-color: white;
	color: black;
	border: 0;
	padding: 0.5rem 1rem;
	border-radius: 1.5rem;
	font-size: 1rem;
}
.cancel-btn {
	cursor: pointer;
	background-color: grey;
	color: black;
	border: 0;
	padding: 0.5rem 1rem;
	border-radius: 1.5rem;
	font-size: 1rem;
}
.form-control {
	width: 100%;
	padding: 1rem 1rem;
	border: 0;
}
.form-control:focus {
	outline: none;
}


/* .user-message {
	// background-color: #e0f7fa; 
	background-color: rgb(37, 37, 37);
	padding: 0.5rem 1rem;
	border-radius: 1.5rem;
	margin-bottom: 1.25rem;
	text-align: right;
}
.assistant-message {
	// background-color: #f1f8e9;
	padding: 0.5rem 1rem;
	border-radius: 1.5rem;
	margin-bottom: 1.25rem;
	text-align: left;
} */
</style>

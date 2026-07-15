# 🤖 Local Ollama Integration Guide

Ollama Pet operates entirely local AI models. It connects to an active instance of **Ollama** running on the host machine. This document explains how the API services are configured, and how LLM streaming responses are handled.

---

## 🔌 Connection Setup

By default, the application attempts to communicate with the standard Ollama REST API endpoint:
`http://localhost:11434`

Users can customize this connection string in the chat header settings. The endpoint is saved in the Zustand store (`ollamaUrl`) and is used for all API queries.

---

## 📦 API Services Explained

All communication logic resides in [ollama.ts](file:///src/services/ollama.ts):

### 1. Connection Health Check (`checkOllamaStatus`)
Validates whether Ollama is active by querying the base REST port:
```typescript
export async function checkOllamaStatus(url: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    return res.status === 200;
  } catch {
    return false;
  }
}
```

### 2. Fetching Local Models (`fetchOllamaModels`)
Retrieves the list of pulled models on the user's computer via `/api/tags`. The chat header uses this list to populate the model selector dropdown:
```typescript
export async function fetchOllamaModels(url: string): Promise<string[]> {
  const res = await fetch(`${url}/api/tags`);
  const data = await res.json();
  return data.models.map((m: any) => m.name);
}
```

### 3. Streaming Chat responses (`chatOllamaStream`)
Queries `/api/chat` with `stream: true`. It consumes the stream using standard browser stream reader APIs (`ReadableStreamDefaultReader`):
```typescript
export async function chatOllamaStream(
  url: string,
  model: string,
  messages: Message[],
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (error: string) => void
)
```

---

## 🌊 Stream Parsing (NDJSON)

Ollama streams responses using **Newline Delimited JSON (NDJSON)**. Instead of sending a single large JSON array, the server sends a sequence of individual JSON objects separated by newline characters (`\n`).

### Example Stream Chunk:
```json
{"model":"llama3","created_at":"...","message":{"role":"assistant","content":"Hello"},"done":false}
{"model":"llama3","created_at":"...","message":{"role":"assistant","content":" there"},"done":false}
{"model":"llama3","created_at":"...","message":{"role":"assistant","content":"!"},"done":true}
```

### How We Parse the Stream:
1. Fetch response body and open a reader: `response.body.getReader()`.
2. Continuously read chunks and decode binary values to text using `TextDecoder`.
3. Split the text chunk by `\n` to isolate JSON lines:
   ```typescript
   const lines = chunk.split('\n');
   ```
4. Parse each line:
   - Extract `json.message.content` and fire `onChunk(content)` to append the token to Zustand and render it in the chat panel.
   - Look for `json.done === true`. Once encountered, invoke `onDone()` to finalize text generation and reset the pet state back to `Idle`.

---

## ⚠️ Error Handling

If a connection failure occurs (e.g., Ollama is not running, or a model isn't downloaded):
- The service catches the exception and routes it to `onError(err)`.
- The chat window appends a system warning message to the chat layout: `⚠️ Failed to communicate with Ollama`.
- The pet state transitions back to `Idle` (or displays an error speech bubble).

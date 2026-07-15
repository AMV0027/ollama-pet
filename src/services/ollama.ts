import { fetch } from '@tauri-apps/plugin-http';
import { Message } from '../stores/usePetStore';

interface OllamaGenerateRequest {
  model: string;
  messages: Message[];
  stream: boolean;
}

export async function checkOllamaStatus(url: string = 'http://localhost:11434'): Promise<boolean> {
  try {
    const res = await fetch(url);
    return res.status === 200;
  } catch (e) {
    return false;
  }
}

export async function fetchOllamaModels(url: string = 'http://localhost:11434'): Promise<string[]> {
  try {
    const res = await fetch(`${url}/api/tags`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.models.map((m: any) => m.name);
  } catch (e) {
    console.error('Failed to fetch models:', e);
    return [];
  }
}

export async function chatOllamaStream(
  url: string,
  model: string,
  messages: Message[],
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (error: string) => void
) {
  try {
    const request: OllamaGenerateRequest = {
      model,
      messages,
      stream: true,
    };

    const response = await fetch(`${url}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.trim() === '') continue;
        try {
          const json = JSON.parse(line);
          if (json.message?.content) {
            onChunk(json.message.content);
          }
          if (json.done) {
            onDone();
          }
        } catch (e) {
          console.warn('Failed to parse JSON stream chunk:', line);
        }
      }
    }
  } catch (err: any) {
    onError(err.message || 'Failed to communicate with Ollama');
  }
}

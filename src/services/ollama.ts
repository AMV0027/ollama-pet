import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { fetch } from '@tauri-apps/plugin-http';
import { Message } from '../stores/usePetStore';

interface OllamaGenerateRequest {
  model: string;
  messages: { role: string; content: string; images?: string[] }[];
  stream: boolean;
}

interface ProxyResponse {
  status: number;
  body: string;
}

// ─── Tauri detection ──────────────────────────────────────────────────────────
const isTauri = (): boolean => {
  return typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;
};

// ─── Non-streaming helpers (status check, model fetch) ──────────────────────

export async function checkOllamaStatus(url: string = 'http://localhost:11434'): Promise<boolean> {
  if (isTauri()) {
    try {
      const res: ProxyResponse = await invoke('ollama_proxy', {
        url: `${url}/`,
        method: 'GET',
      });
      return res.status === 200;
    } catch (e) {
      console.error('Ollama status check failed:', e);
      return false;
    }
  }

  // Fallback for dev mode (browser)
  try {
    const res = await fetch(url);
    return res.status === 200;
  } catch (e) {
    return false;
  }
}

export async function fetchOllamaModels(url: string = 'http://localhost:11434'): Promise<string[]> {
  if (isTauri()) {
    try {
      const res: ProxyResponse = await invoke('ollama_proxy', {
        url: `${url}/api/tags`,
        method: 'GET',
      });
      if (res.status !== 200) return [];
      const data = JSON.parse(res.body);
      return data.models?.map((m: any) => m.name) || [];
    } catch (e) {
      console.error('Failed to fetch models:', e);
      return [];
    }
  }

  // Fallback for dev mode (browser)
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

// ─── Streaming chat (Rust event-based proxy vs browser fetch) ───────────────

export async function chatOllamaStream(
  url: string,
  model: string,
  messages: Message[],
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (error: string) => void
) {
  if (isTauri()) {
    return chatOllamaStreamTauri(url, model, messages, onChunk, onDone, onError);
  }

  // Fallback for dev mode using @tauri-apps/plugin-http fetch
  return chatOllamaStreamBrowser(url, model, messages, onChunk, onDone, onError);
}

/**
 * Tauri mode: Uses the Rust proxy command + event-based streaming.
 * This completely bypasses CORS restrictions.
 */
async function chatOllamaStreamTauri(
  url: string,
  model: string,
  messages: Message[],
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (error: string) => void
) {
  const request: OllamaGenerateRequest = {
    model,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
      images: m.images ? m.images.map(img => img.split(',')[1] || img) : undefined,
    })),
    stream: true,
  };

  const body = JSON.stringify(request);

  // Set up event listeners before invoking the stream command
  const unlistenChunk = await listen<string>('ollama-stream-chunk', (event) => {
    const chunk = event.payload;
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.trim() === '') continue;
      try {
        const json = JSON.parse(line);
        if (json.message?.content) {
          onChunk(json.message.content);
        }
      } catch (e) {
        console.warn('Failed to parse JSON stream chunk:', line);
      }
    }
  });

  const unlistenDone = listen<string>('ollama-stream-done', () => {
    onDone();
  });

  const unlistenError = listen<string>('ollama-stream-error', (event) => {
    onError(event.payload);
  });

  // Start the streaming command
  try {
    await invoke('ollama_proxy_stream', {
      url: `${url}/api/chat`,
      body,
    });
  } catch (err: any) {
    onError(err?.message || 'Failed to communicate with Ollama via proxy');
  } finally {
    // Clean up listeners
    (await unlistenChunk)();
    (await unlistenDone)();
    (await unlistenError)();
  }
}

/**
 * Browser/dev mode: Uses the @tauri-apps/plugin-http fetch with ReadableStream.
 */
async function chatOllamaStreamBrowser(
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
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        images: m.images ? m.images.map(img => img.split(',')[1] || img) : undefined,
      })),
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
            // Note: for browser mode we keep json.done detection since there's
            // no separate done event
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

export type { Message };

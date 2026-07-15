# Ollama Pet Documentation Hub 🐾

Welcome to the technical documentation for **Ollama Pet**! This directory contains detailed guides for developers, designers, and contributors looking to understand the inner workings of the application, customize the assets, or extend its capabilities.

---

## 📖 Document Navigation

Select one of the topics below to learn more:

### 1. 🏗️ [Architecture & Window Sync](architecture.md)
* Learn how the multi-window system works in Tauri 2.
* Understand the event-driven communication model using Tauri's `emit` and `listen` APIs.
* Dive into our global state management with Zustand.

### 2. 🎭 [Animation & Sprite Customization Guide](animation_guide.md)
* Understand how sprite sheets and individual frame images are dynamically resolved in React via Vite's `import.meta.glob`.
* Learn the configuration structure (`ANIM_CONFIG`) for adjusting animation loop speeds and behaviors.
* Step-by-step instructions on how to create and add a custom pet character with new animation states.

### 3. 🤖 [Local Ollama Integration & API Services](ollama_integration.md)
* Overview of the Ollama API integration layer (`src/services/ollama.ts`).
* Explanation of how local LLM streams are read, parsed from NDJSON (Newline Delimited JSON), and updated in the chat interface.
* Guidelines on checking connection status, fallback mechanisms, and fetching active models.

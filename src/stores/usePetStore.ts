import { create } from 'zustand';

export type PetState =
  | 'Idle'
  | 'Looking'
  | 'Thinking'
  | 'Talking'
  | 'Typing'
  | 'Walking'
  | 'Sleeping'
  | 'Waving'
  | 'Jumping'
  | 'Dragging';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface PetStore {
  petState: PetState;
  setPetState: (state: PetState) => void;

  speechBubble: string | null;
  setSpeechBubble: (text: string | null) => void;

  isChatOpen: boolean;
  setChatOpen: (isOpen: boolean) => void;
  toggleChat: () => void;

  chatPosition: 'left' | 'right';
  setChatPosition: (pos: 'left' | 'right') => void;

  walkingDirection: number; // 1 = right, -1 = left
  setWalkingDirection: (dir: number) => void;

  messages: Message[];
  addMessage: (msg: Message) => void;
  appendLastMessage: (chunk: string) => void;
  clearMessages: () => void;

  ollamaUrl: string;
  setOllamaUrl: (url: string) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  availableModels: string[];
  setAvailableModels: (models: string[]) => void;
}

export const usePetStore = create<PetStore>((set) => ({
  petState: 'Idle',
  setPetState: (state) => set({ petState: state }),

  speechBubble: null,
  setSpeechBubble: (text) => set({ speechBubble: text }),

  isChatOpen: false,
  setChatOpen: (isOpen) => set({ isChatOpen: isOpen }),
  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),

  chatPosition: 'right',
  setChatPosition: (pos) => set({ chatPosition: pos }),

  walkingDirection: 1,
  setWalkingDirection: (dir) => set({ walkingDirection: dir }),

  messages: [],
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  appendLastMessage: (chunk) =>
    set((state) => {
      const messages = [...state.messages];
      if (messages.length > 0) {
        messages[messages.length - 1] = {
          ...messages[messages.length - 1],
          content: messages[messages.length - 1].content + chunk,
        };
      }
      return { messages };
    }),
  clearMessages: () => set({ messages: [] }),

  ollamaUrl: 'http://localhost:11434',
  setOllamaUrl: (url) => set({ ollamaUrl: url }),
  selectedModel: 'llama3',
  setSelectedModel: (model) => set({ selectedModel: model }),
  availableModels: ['llama3'], // default fallback
  setAvailableModels: (models) => set({ availableModels: models }),
}));

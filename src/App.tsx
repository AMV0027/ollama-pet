import { useEffect, useRef, useState } from 'react';
import { Pet } from './components/Pet/Pet';
import { Chat } from './components/Chat/Chat';
import { usePetStore, PetState } from './stores/usePetStore';
import { chatOllamaStream, fetchOllamaModels } from './services/ollama';
import { Send, Loader2, X, Minimize2, Trash2 } from 'lucide-react';
import { getCurrentWindow, PhysicalPosition, Window } from '@tauri-apps/api/window';
import { emit, listen } from '@tauri-apps/api/event';

// ─── Idle animation pool ──────────────────────────────────────────────────────
const IDLE_STATES: PetState[] = ['Idle', 'Looking', 'Walking', 'Typing', 'Waving', 'Jumping'];

function App() {
  const [windowLabel, setWindowLabel] = useState<string | null>(null);

  // Store actions and state
  const {
    petState,
    setPetState,
    isChatOpen,
    setChatOpen,
    walkingDirection,
    setWalkingDirection,
    ollamaUrl,
    selectedModel,
    setSelectedModel,
    availableModels,
    setAvailableModels,
    addMessage,
    appendLastMessage,
    setSpeechBubble,
    clearMessages,
  } = usePetStore();

  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ─── Timers and Loop Refs ─────────────────────────────────────────────────
  const sequenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sleepTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const walkIntervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const isUserActiveRef  = useRef(true);

  // ─── Detect current window ────────────────────────────────────────────────
  useEffect(() => {
    setWindowLabel(getCurrentWindow().label);
  }, []);

  // ─── Event syncing between windows ────────────────────────────────────────
  useEffect(() => {
    if (!windowLabel) return;

    // Listen for state changes from the chat window
    const unlistenState = listen<string>('pet-state-change', (event) => {
      setPetState(event.payload as PetState);
    });

    // Listen for bubble changes from the chat window
    const unlistenBubble = listen<string | null>('pet-bubble-change', (event) => {
      setSpeechBubble(event.payload);
    });

    // Listen for visibility changes (open/closed)
    const unlistenVisibility = listen<boolean>('chat-visibility-change', (event) => {
      setChatOpen(event.payload);
    });

    return () => {
      unlistenState.then((f) => f());
      unlistenBubble.then((f) => f());
      unlistenVisibility.then((f) => f());
    };
  }, [windowLabel, setPetState, setSpeechBubble, setChatOpen]);

  // ─── Fetch available Ollama models (Chat window only) ────────────────────
  useEffect(() => {
    if (windowLabel !== 'chat') return;
    const loadModels = async () => {
      const models = await fetchOllamaModels(ollamaUrl);
      if (models.length > 0) {
        setAvailableModels(models);
        if (!models.includes(selectedModel)) {
          setSelectedModel(models[0]);
        }
      }
    };
    loadModels();
  }, [windowLabel, ollamaUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Walking Movement Loop (Pet/Main window only) ─────────────────────────
  useEffect(() => {
    if (windowLabel !== 'main') return;
    if (walkIntervalRef.current) clearInterval(walkIntervalRef.current);

    // Only walk when state is Walking and chat panel is closed
    if (petState === 'Walking' && !isChatOpen) {
      walkIntervalRef.current = setInterval(async () => {
        try {
          const windowObj = getCurrentWindow() as any;
          const curPos = await windowObj.outerPosition();
          const monitor = await windowObj.currentMonitor();
          if (monitor) {
            const scaleFactor = monitor.scaleFactor || 1;
            const step = Math.round(1.5 * scaleFactor);
            const nextX = curPos.x + (walkingDirection * step);

            // Screen boundaries
            const leftLimit = Math.round(20 * scaleFactor);
            const rightLimit = monitor.size.width - Math.round(140 * scaleFactor);

            if (nextX > rightLimit) {
              setWalkingDirection(-1);
            } else if (nextX < leftLimit) {
              setWalkingDirection(1);
            } else {
              await windowObj.setPosition(new PhysicalPosition(nextX, curPos.y));
            }
          }
        } catch (err) {
          console.error('Error during walking movement:', err);
        }
      }, 40);
    }

    return () => {
      if (walkIntervalRef.current) clearInterval(walkIntervalRef.current);
    };
  }, [windowLabel, petState, walkingDirection, isChatOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Idle Animation Loop (Pet/Main window only) ───────────────────────────
  const stopTimers = () => {
    if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);
    if (sleepTimerRef.current)    clearTimeout(sleepTimerRef.current);
  };

  const playNextIdleClip = () => {
    if (windowLabel !== 'main' || !isUserActiveRef.current) return;

    // Pick a random idle state
    const randomState = IDLE_STATES[Math.floor(Math.random() * IDLE_STATES.length)];
    const durationMs = Math.floor(Math.random() * 7000) + 3000; // 3 to 10 seconds

    const cur = usePetStore.getState().petState;
    if (!['Thinking', 'Talking'].includes(cur)) {
      if (randomState === 'Walking' && isChatOpen) {
        setPetState('Idle');
      } else {
        setPetState(randomState);
      }
    }

    sequenceTimerRef.current = setTimeout(playNextIdleClip, durationMs);
  };

  const onUserActivity = () => {
    if (windowLabel !== 'main') return;
    if (!isUserActiveRef.current) {
      isUserActiveRef.current = true;
      setPetState('Waving');
      setTimeout(() => playNextIdleClip(), 2400);
    }
    stopTimers();
    isUserActiveRef.current = true;
    sleepTimerRef.current = setTimeout(() => {
      isUserActiveRef.current = false;
      const cur = usePetStore.getState().petState;
      if (!['Thinking', 'Talking'].includes(cur)) {
        setPetState('Sleeping');
      }
    }, 10_000); // 10 seconds of inactivity -> goes to Sleeping
  };

  useEffect(() => {
    if (windowLabel !== 'main') return;
    setPetState('Waving');
    setTimeout(() => { playNextIdleClip(); }, 2400);
    onUserActivity();

    window.addEventListener('mousemove', onUserActivity);
    window.addEventListener('keydown',   onUserActivity);

    return () => {
      stopTimers();
      window.removeEventListener('mousemove', onUserActivity);
      window.removeEventListener('keydown',   onUserActivity);
    };
  }, [windowLabel]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Toggle Chat Window (Pet/Main window action) ─────────────────────────
  const toggleChatWindow = async () => {
    try {
      const chatWin = await Window.getByLabel('chat');
      if (!chatWin) return;

      const isVisible = await chatWin.isVisible();
      if (isVisible) {
        await chatWin.hide();
        setChatOpen(false);
        await emit('chat-visibility-change', false);
      } else {
        await chatWin.show();
        await chatWin.setFocus();
        setChatOpen(true);
        await emit('chat-visibility-change', true);
        try {
          await (getCurrentWindow() as any).setAlwaysOnTop(true);
        } catch {}
      }
    } catch (err) {
      console.error('Failed to toggle chat window:', err);
    }
  };

  // ─── Ask submit (Chat window action) ──────────────────────────────────────
  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || isGenerating) return;

    setInput('');
    setIsGenerating(true);

    // Tell pet window to change to Thinking
    await emit('pet-state-change', 'Thinking');
    await emit('pet-bubble-change', 'Thinking...');

    const userMsg = { role: 'user' as const, content: q };
    addMessage(userMsg);
    addMessage({ role: 'assistant', content: '' });

    let firstChunk = true;
    await chatOllamaStream(
      ollamaUrl,
      selectedModel,
      [userMsg],
      async (chunk) => {
        if (firstChunk) {
          await emit('pet-state-change', 'Talking');
          await emit('pet-bubble-change', null);
          firstChunk = false;
        }
        appendLastMessage(chunk);
      },
      async () => {
        setIsGenerating(false);
        await emit('pet-state-change', 'Idle');
        await emit('pet-bubble-change', null);
      },
      async (err) => {
        console.error(err);
        await emit('pet-state-change', 'Idle');
        await emit('pet-bubble-change', '⚠️ ' + err);
        setIsGenerating(false);
      }
    );
  };

  // ─── Close / Minimize (Chat window actions) ──────────────────────────────
  const handleChatClose = async () => {
    try {
      const chatWin = getCurrentWindow();
      await chatWin.hide();
      setChatOpen(false);
      await emit('chat-visibility-change', false);
    } catch {}
  };

  const handleChatMinimize = async () => {
    try {
      await getCurrentWindow().minimize();
    } catch {}
  };

  const handleChatDrag = async () => {
    try {
      await getCurrentWindow().startDragging();
    } catch {}
  };

  // ─── Render View based on Window Label ────────────────────────────────────
  if (windowLabel === 'main') {
    return (
      <div className="app-shell justify-center items-center">
        {/* Only the pet is in this window. Click triggers the separate chat window */}
        <div className="pet-column items-center justify-center">
          <Pet onClickOverride={toggleChatWindow} />
        </div>
      </div>
    );
  }

  if (windowLabel === 'chat') {
    return (
      <div className="app-shell--chat">
        {/* Header with drag zone, model selector, and close controls */}
        <div className="chat-header" data-tauri-drag-region onMouseDown={handleChatDrag} style={{ cursor: 'grab' }}>
          <div className="flex items-center gap-2">
            <span className="status-dot" />
            <span className="chat-title">Chat</span>
            <select
              className="model-select"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              onMouseDown={(e) => e.stopPropagation() /* Prevent window drag when clicking select */}
            >
              {availableModels.map((m) => (
                <option key={m} value={m}>
                  {m.includes(':') ? m.split(':')[0] : m}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
            <button className="icon-btn" onClick={clearMessages} title="Clear conversation">
              <Trash2 size={13} />
            </button>
            <button className="icon-btn" onClick={handleChatMinimize} title="Minimize">
              <Minimize2 size={13} />
            </button>
            <button className="icon-btn" onClick={handleChatClose} title="Close">
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Scrolling messages list */}
        <Chat />

        {/* Input bar at the bottom */}
        <form className="quick-ask-bar" onSubmit={handleAsk}>
          <input
            ref={inputRef}
            className="quick-ask-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me..."
            disabled={isGenerating}
            autoComplete="off"
            spellCheck={false}
          />
          <button className="quick-ask-btn" type="submit" disabled={!input.trim() || isGenerating}>
            {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
          </button>
        </form>
      </div>
    );
  }

  // Fallback while loading window label
  return null;
}

export default App;

import { useEffect, useRef, useState } from 'react';
import { Pet } from './components/Pet/Pet';
import { Chat } from './components/Chat/Chat';
import { usePetStore, PetState } from './stores/usePetStore';
import { chatOllamaStream, fetchOllamaModels } from './services/ollama';
import { loadChatSessions, saveChatSession, deleteChatSession, pruneAllSessions, HistoryItem } from './services/historyDb';
import { Send, Loader2, X, Minimize2, Trash2, GamepadDirectional, Menu, Plus, Trash, Paperclip, Search } from 'lucide-react';
import { getCurrentWindow, Window } from '@tauri-apps/api/window';
import { emit, listen } from '@tauri-apps/api/event';

// ─── Idle animation pool ──────────────────────────────────────────────────────
const IDLE_STATES: PetState[] = ['Idle', 'Looking', 'Thinking', 'Walking', 'Typing', 'Waving', 'Jumping'];

function App() {
  const [windowLabel, setWindowLabel] = useState<string | null>(null);

  // Store actions and state
  const {
    setPetState,
    isChatOpen,
    setChatOpen,
    ollamaUrl,
    selectedModel,
    setSelectedModel,
    availableModels,
    setAvailableModels,
    addMessage,
    appendLastMessage,
    setSpeechBubble,
    clearMessages,
    setWalkingDirection,
    messages,
  } = usePetStore();


  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAnimControls, setShowAnimControls] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cool coder timestamp helper
  const formatCoolTimestamp = (timestamp: number): string => {
    const d = new Date(timestamp);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());
    return `SYS_LOG_${year}${month}${day}_${hours}${minutes}${seconds}`;
  };

  // ─── Auto-resize input textarea ───────────────────────────────────────────
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = '24px';
      const scrollHeight = inputRef.current.scrollHeight;
      inputRef.current.style.height = `${Math.min(Math.max(scrollHeight, 24), 80)}px`;
    }
  }, [input]);


  // ─── Timers and Loop Refs ─────────────────────────────────────────────────
  const sequenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sleepTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
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

    // Listen for walking direction changes from the chat window
    const unlistenDirection = listen<number>('pet-direction-change', (event) => {
      setWalkingDirection(event.payload);
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
      unlistenDirection.then((f) => f());
      unlistenBubble.then((f) => f());
      unlistenVisibility.then((f) => f());
    };
  }, [windowLabel, setPetState, setWalkingDirection, setSpeechBubble, setChatOpen]);

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

  // ─── Load Chat History from SQLite (Chat window only) ───────────────
  useEffect(() => {
    if (windowLabel !== 'chat') return;
    const fetchHistory = async () => {
      const saved = await loadChatSessions();
      setHistory(saved);
    };
    fetchHistory();
  }, [windowLabel]);

  // ─── Auto-save current conversation to SQLite ─────────────────────────────
  useEffect(() => {
    if (windowLabel !== 'chat') return;
    if (messages.length === 0) {
      setCurrentChatId(null);
      return;
    }

    const autoSave = async () => {
      let activeId = currentChatId;
      let activeTitle = 'New Conversation';

      if (!activeId) {
        const newId = 'chat-' + Date.now();
        activeId = newId;
        setCurrentChatId(newId);

        activeTitle = formatCoolTimestamp(Date.now());
      } else {
        const existing = history.find((h) => h.id === activeId);
        if (existing) {
          activeTitle = existing.title;
        } else {
          activeTitle = formatCoolTimestamp(Date.now());
        }
      }

      await saveChatSession(activeId, activeTitle, messages);
      // Refresh history list to reflect latest changes
      const updatedList = await loadChatSessions();
      setHistory(updatedList);
    };

    autoSave();
  }, [messages, windowLabel]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Walking Movement Loop (Pet/Main window only) ─────────────────────────
  // Note: Walking window movement is now handled in sync with animation frames inside Pet.tsx


  // ─── Idle Animation Loop (Pet/Main window only) ───────────────────────────
  const stopTimers = () => {
    if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);
    if (sleepTimerRef.current)    clearTimeout(sleepTimerRef.current);
  };

  const playNextIdleClip = () => {
    if (windowLabel !== 'main' || !isUserActiveRef.current) return;

    // Pick a random idle state
    const randomState = IDLE_STATES[Math.floor(Math.random() * IDLE_STATES.length)];
    let durationMs = Math.floor(Math.random() * 7000) + 3000; // 3 to 10 seconds

    const cur = usePetStore.getState().petState;
    if (!['Thinking', 'Talking'].includes(cur)) {
      if (randomState === 'Walking' && isChatOpen) {
        setPetState('Idle');
      } else {
        if (randomState === 'Walking') {
          // Walk cycle duration is 800ms
          // Randomly choose 5 to 10 cycles
          const cycles = Math.floor(Math.random() * 6) + 5; // 5 to 10
          durationMs = cycles * 800;

          // Randomize walking direction: 1 = right, -1 = left
          const dir = Math.random() < 0.5 ? 1 : -1;
          usePetStore.getState().setWalkingDirection(dir);
        } else if (randomState === 'Jumping') {
          // Jumping cycle duration is 600ms, play 1 to 3 jumps
          const jumps = Math.floor(Math.random() * 3) + 1;
          durationMs = jumps * 600;
        }
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAttachedImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleEditMessage = async (index: number, newContent: string) => {
    if (isGenerating) return;

    const originalMsg = messages[index];
    const updatedMsg = { ...originalMsg, content: newContent };
    const truncatedHistory = [...messages.slice(0, index), updatedMsg];

    usePetStore.setState({
      messages: [...truncatedHistory, { role: 'assistant', content: '' }]
    });

    setIsGenerating(true);
    await emit('pet-state-change', 'Thinking');
    await emit('pet-bubble-change', 'Thinking...');

    let firstChunk = true;
    await chatOllamaStream(
      ollamaUrl,
      selectedModel,
      truncatedHistory.map(m => ({
        role: m.role,
        content: m.content,
        images: m.images ? m.images.map(img => img.split(',')[1] || img) : undefined
      })),
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

    const userMsg = { 
      role: 'user' as const, 
      content: q,
      images: attachedImages.length > 0 ? [...attachedImages] : undefined
    };

    setAttachedImages([]);

    const historyToSend = [...messages, userMsg];

    addMessage(userMsg);
    addMessage({ role: 'assistant', content: '' });

    let firstChunk = true;
    await chatOllamaStream(
      ollamaUrl,
      selectedModel,
      historyToSend.map(m => ({
        role: m.role,
        content: m.content,
        images: m.images ? m.images.map(img => img.split(',')[1] || img) : undefined
      })),
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
            <button
              className={`icon-btn ${showSidebar ? 'icon-btn--active' : ''}`}
              onClick={() => setShowSidebar(!showSidebar)}
              onMouseDown={(e) => e.stopPropagation()}
              title="Toggle history sidebar"
            >
              <Menu size={13} />
            </button>
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
            <button
              className={`icon-btn ${showAnimControls ? 'icon-btn--active' : ''}`}
              onClick={() => setShowAnimControls(!showAnimControls)}
              title="Control pet animation"
            >
              <GamepadDirectional size={13} />
            </button>
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

        {showAnimControls && (
          <div className="anim-controls-popover" onMouseDown={(e) => e.stopPropagation()}>
            <div className="anim-controls-title">Pet Action Trigger</div>
            <div className="anim-controls-grid">
              {[
                { name: 'Idle', state: 'Idle' },
                { name: 'Looking', state: 'Looking' },
                { name: 'Thinking', state: 'Thinking' },
                { name: 'Walk Left', state: 'Walking', dir: -1 },
                { name: 'Walk Right', state: 'Walking', dir: 1 },
                { name: 'Typing', state: 'Typing' },
                { name: 'Waving', state: 'Waving' },
                { name: 'Jumping', state: 'Jumping' },
                { name: 'Sleeping', state: 'Sleeping' },
              ].map((opt) => (
                <button
                  key={opt.name}
                  className="anim-control-btn"
                  onClick={async () => {
                    if (opt.dir !== undefined) {
                      usePetStore.getState().setWalkingDirection(opt.dir);
                      await emit('pet-direction-change', opt.dir);
                    }
                    setPetState(opt.state as any);
                    await emit('pet-state-change', opt.state);
                    stopTimers();
                    // For Jumping, keep active for 2 loops (1200ms). Others default to 6 seconds.
                    const duration = opt.state === 'Jumping' ? 1200 : 6000;
                    sequenceTimerRef.current = setTimeout(playNextIdleClip, duration);
                  }}
                >
                  {opt.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Scrolling messages list */}
        <Chat onEditMessage={handleEditMessage} />

        {/* Input bar at the bottom */}
        <form className="quick-ask-bar" onSubmit={handleAsk}>
          {attachedImages.length > 0 && (
            <div className="attached-images-preview flex gap-1 mb-1 px-1 flex-wrap w-full">
              {attachedImages.map((img, idx) => (
                <div key={idx} className="relative w-8 h-8 border border-neutral-300 rounded">
                  <img src={img} className="w-full h-full object-cover rounded" />
                  <button
                    type="button"
                    className="absolute -top-1 -right-1 bg-neutral-900 text-white rounded-full p-0 flex items-center justify-center cursor-pointer hover:bg-neutral-800"
                    style={{ width: '12px', height: '12px', fontSize: '8px' }}
                    onClick={() => setAttachedImages((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
          />
          <button
            type="button"
            className="quick-ask-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Attach image"
            disabled={isGenerating}
          >
            <Paperclip size={12} />
          </button>
          <textarea
            ref={inputRef}
            className="quick-ask-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                handleAsk(fakeEvent);
              }
            }}
            placeholder="Ask me..."
            disabled={isGenerating}
            spellCheck={false}
            rows={1}
          />
          <button className="quick-ask-btn" type="submit" disabled={!input.trim() || isGenerating}>
            {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
          </button>
        </form>

        {showSidebar && (
          <div className="chat-sidebar-overlay" onClick={() => setShowSidebar(false)}>
            <div className="chat-sidebar" onClick={(e) => e.stopPropagation()}>
              <div className="sidebar-header">
                <span className="sidebar-title">History</span>
                <button
                  className="sidebar-new-btn"
                  onClick={() => {
                    clearMessages();
                    setCurrentChatId(null);
                    setShowSidebar(false);
                  }}
                  title="New Conversation"
                >
                  <Plus size={10} />
                  <span>New</span>
                </button>
              </div>

              {/* Cool search logs bar */}
              <div className="sidebar-search px-2 py-1.5 border-b border-neutral-100 bg-neutral-50">
                <div className="flex items-center gap-1.5 bg-white border border-neutral-200 rounded px-2 py-1">
                  <Search size={11} className="text-neutral-400" />
                  <input
                    type="text"
                    className="sidebar-search-input bg-transparent text-xs w-full outline-none text-neutral-800"
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="sidebar-list">
                {(() => {
                  const filteredHistory = history.filter(item => 
                    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
                  );

                  return filteredHistory.length === 0 ? (
                    <div className="sidebar-empty">No matching logs.</div>
                  ) : (
                    filteredHistory.map((item) => (
                      <div
                        key={item.id}
                        className={`sidebar-item ${currentChatId === item.id ? 'active' : ''}`}
                        onClick={() => {
                          usePetStore.setState({ messages: item.messages });
                          setCurrentChatId(item.id);
                          setShowSidebar(false);
                        }}
                      >
                        <span className="sidebar-item-title">{item.title}</span>
                        <button
                          className="sidebar-delete-btn"
                          onClick={async (e) => {
                            e.stopPropagation();
                            await deleteChatSession(item.id);
                            const updated = history.filter((h) => h.id !== item.id);
                            setHistory(updated);
                            if (currentChatId === item.id) {
                              clearMessages();
                              setCurrentChatId(null);
                            }
                          }}
                          title="Delete chat"
                        >
                          <Trash size={10} />
                        </button>
                      </div>
                    ))
                  );
                })()}
              </div>

              {/* Sidebar footer with Prune All button */}
              <div className="sidebar-footer p-2 border-t border-neutral-100 bg-neutral-50 flex justify-center">
                <button
                  className="sidebar-prune-btn text-red-500 hover:bg-red-50 text-xxs font-bold uppercase tracking-wider py-1 px-2 rounded border border-red-200 w-full text-center transition-all cursor-pointer"
                  onClick={async () => {
                    if (confirm("Are you sure you want to prune all conversation logs? This cannot be undone.")) {
                      await pruneAllSessions();
                      setHistory([]);
                      clearMessages();
                      setCurrentChatId(null);
                      setShowSidebar(false);
                    }
                  }}
                >
                  Prune All History
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback while loading window label
  return null;
}

export default App;

import React, { useEffect, useRef, useState } from 'react';
import { usePetStore, PetState } from '../../stores/usePetStore';
import { getCurrentWindow } from '@tauri-apps/api/window';

// ─── Sprite Registry ──────────────────────────────────────────────────────────
const spriteModules = import.meta.glob<{ default: string }>(
  '../../assets/ollamapet_sprite/**/*.png',
  { eager: true }
);

interface AnimConfig {
  frames: string[];
  cycleDurationMs: number;
  loop: boolean;
}

const ANIM_CONFIG: Record<PetState, AnimConfig> = {
  Idle:     { frames: getFrames('idle'),        cycleDurationMs: 0,    loop: false },
  Looking:  { frames: getFrames('looking'),     cycleDurationMs: 1200, loop: true  },
  Thinking: { frames: getFrames('thinking'),    cycleDurationMs: 2000, loop: true  },
  Talking:  { frames: getFrames('speaking'),    cycleDurationMs: 800,  loop: true  },
  Typing:   { frames: getFrames('using_laptop'),cycleDurationMs: 1000, loop: true  },
  Walking:  { frames: getFrames('walking'),     cycleDurationMs: 800,  loop: true  },
  Sleeping: { frames: getFrames('sleeping'),    cycleDurationMs: 1000, loop: true  },
  Waving:   { frames: getFrames('waving'),      cycleDurationMs: 600,  loop: true  },
  Jumping:  { frames: getFrames('jumping'),     cycleDurationMs: 600,  loop: false },
  Dragging: { frames: getFrames('walking'),     cycleDurationMs: 800,  loop: true  },
};

function getFrames(folder: string): string[] {
  const keys = Object.keys(spriteModules).filter((k) => k.includes(`/${folder}/`));
  keys.sort((a, b) => {
    const aFile = a.split('/').pop() ?? '';
    const bFile = b.split('/').pop() ?? '';
    const aNum = parseInt(aFile);
    const bNum = parseInt(bFile);
    if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
    return aFile.localeCompare(bFile);
  });
  return keys.map((k) => spriteModules[k].default);
}

const STATE_BUBBLES: Partial<Record<PetState, string[]>> = {
  Thinking: ['Hmm...', 'Let me think...', '🤔', 'Processing...'],
  Waving:   ['Hey there! 👋', 'Hello!', 'Hi! 😊'],
  Sleeping: ['Zzz...', '💤', '...zzz...'],
  Walking:  ['Going for a stroll~', '🚶', 'Exploring!'],
  Typing:   ['Tap tap tap...', '⌨️', 'Coding away~'],
  Looking:  ['Hmm?', '👀', 'What was that?'],
  Jumping:  ['Woohoo! 🎉', 'Yay!', '✨'],
};

export const Pet: React.FC<{ onClickOverride?: () => void }> = ({ onClickOverride }) => {
  const { petState, toggleChat, speechBubble, setSpeechBubble, walkingDirection } = usePetStore();
  const [frameIndex, setFrameIndex] = useState(0);
  const bubbleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevStateRef = useRef<PetState>(petState);

  const config = ANIM_CONFIG[petState] ?? ANIM_CONFIG.Idle;
  const frames = config.frames;
  const frameInterval = frames.length > 1 ? config.cycleDurationMs / frames.length : 0;

  // ─── Click/Drag disambiguation ───────────────────────────────────────────
  const dragStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleMouseDown = async (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    dragStartRef.current = { x: e.screenX, y: e.screenY, time: Date.now() };
    try {
      await getCurrentWindow().startDragging();
    } catch {}
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!dragStartRef.current) return;
    const dx = Math.abs(e.screenX - dragStartRef.current.x);
    const dy = Math.abs(e.screenY - dragStartRef.current.y);
    const dt = Date.now() - dragStartRef.current.time;

    // Treat as click if dragged less than 5px and mouse was down less than 250ms
    if (dx < 5 && dy < 5 && dt < 250) {
      if (onClickOverride) {
        onClickOverride();
      } else {
        toggleChat();
      }
    }
    dragStartRef.current = null;
  };

  // ─── Close / Minimize ────────────────────────────────────────────────────
  const handleClose = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await getCurrentWindow().close();
    } catch {}
  };

  const handleMinimize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await getCurrentWindow().minimize();
    } catch {}
  };

  const handleChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClickOverride) {
      onClickOverride();
    } else {
      toggleChat();
    }
  };

  // ─── Frame animation ticker ──────────────────────────────────────────────
  useEffect(() => {
    setFrameIndex(0);
    if (frames.length <= 1 || frameInterval <= 0) return;

    const interval = setInterval(() => {
      setFrameIndex((prev) => {
        if (!config.loop && prev >= frames.length - 1) return prev;
        return (prev + 1) % frames.length;
      });
    }, frameInterval);

    return () => clearInterval(interval);
  }, [petState, frames.length, frameInterval, config.loop]);

  // ─── Speech bubble ticker ───────────────────────────────────────────────
  useEffect(() => {
    if (prevStateRef.current === petState) return;
    prevStateRef.current = petState;

    const bubbles = STATE_BUBBLES[petState];
    if (bubbles && bubbles.length > 0) {
      const text = bubbles[Math.floor(Math.random() * bubbles.length)];
      setSpeechBubble(text);

      if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
      bubbleTimeoutRef.current = setTimeout(() => setSpeechBubble(null), 2500);
    } else {
      setSpeechBubble(null);
    }

    return () => {
      if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
    };
  }, [petState, setSpeechBubble]);

  const currentImage = frames[frameIndex] ?? frames[0];

  return (
    <div className="pet-root select-none group relative">

      {/* ── Speech Bubble ── */}
      {speechBubble && (
        <div key={speechBubble} className="speech-bubble mt-2">
          {speechBubble}
        </div>
      )}

      {/* ── Sprite wrapper (Handles both drag movement and window toggle clicks) ── */}
      <div 
        className="pet-container" 
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        {currentImage ? (
          <img
            src={currentImage}
            alt={petState}
            className={`pet-sprite animate-bob ${walkingDirection === -1 ? 'scale-x-[-1]' : ''}`}
            draggable={false}
          />
        ) : (
          <div className="fallback-sprite">{petState[0]}</div>
        )}
      </div>

      {/* ── Minimalist Window Controls (fade in on hover) ── */}
      <div className="pet-win-controls opacity-0 group-hover:opacity-100 transition-opacity duration-200" onMouseDown={(e) => e.stopPropagation()}>
        <button className="win-btn win-btn--close bg-red-500" onClick={handleClose} title="Close" ></button>
        <button className="win-btn win-btn--minimize bg-green-500" onClick={handleMinimize} title="Minimize" ></button>
        <button className="win-btn win-btn--chat bg-blue-500" onClick={handleChat} title="Chat" ></button>
      </div>
    </div>
  );
};

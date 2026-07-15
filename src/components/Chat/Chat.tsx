import React, { useRef, useEffect, useState } from 'react';
import { usePetStore } from '../../stores/usePetStore';
import { Copy, Check, Edit3 } from 'lucide-react';
import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import 'katex/dist/katex.min.css';

// Configure marked with the KaTeX extension for math formulas
const initKatexExtension = () => {
  try {
    const extension = typeof markedKatex === 'function' 
      ? markedKatex 
      : (markedKatex as any).default;
    
    if (extension) {
      marked.use(extension({
        throwOnError: false,
        nonStandard: true
      }));
    }
  } catch (err) {
    console.error('Failed to register marked-katex-extension:', err);
  }
};
initKatexExtension();

const AssistantBubble: React.FC<{ content: string; isGenerating: boolean }> = ({ content, isGenerating }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Convert markdown to HTML using marked (supporting tables and math formulas)
  let parsedHtml = '';
  try {
    parsedHtml = content ? (marked.parse(content) as string) : '';
  } catch (err) {
    console.error('Failed to parse markdown:', err);
    // Safe HTML fallback that preserves spaces and newlines
    parsedHtml = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br/>');
  }
  
  let displayHtml = parsedHtml;
  if (isGenerating) {
    if (displayHtml.endsWith('</p>')) {
      displayHtml = displayHtml.slice(0, -4) + '<span class="typing-cursor"></span></p>';
    } else if (displayHtml.endsWith('</li>')) {
      displayHtml = displayHtml.slice(0, -5) + '<span class="typing-cursor"></span></li>';
    } else {
      displayHtml = displayHtml + '<span class="typing-cursor"></span>';
    }
  }

  return (
    <div className="bubble bubble--assistant group relative pr-8">
      {displayHtml ? (
        <div 
          className="markdown-content"
          dangerouslySetInnerHTML={{ __html: displayHtml }}
        />
      ) : (
        <span className="typing-cursor" />
      )}
      {content && (
        <button
          className="copy-btn absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-neutral-200 text-neutral-400 hover:text-neutral-700"
          onClick={handleCopy}
          title="Copy response"
        >
          {copied ? <Check size={11} className="text-green-600" /> : <Copy size={11} />}
        </button>
      )}
    </div>
  );
};

const UserBubble: React.FC<{
  content: string;
  images?: string[];
  index: number;
  onEdit: (index: number, newContent: string) => void;
}> = ({ content, images, index, onEdit }) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editVal, setEditVal] = useState(content);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy user prompt:', err);
    }
  };

  const handleSave = () => {
    if (editVal.trim() !== '') {
      onEdit(index, editVal);
      setIsEditing(false);
    }
  };

  return (
    <div className="bubble bubble--user group relative pr-12">
      {isEditing ? (
        <div className="flex flex-col gap-1 w-full" onMouseDown={(e) => e.stopPropagation()}>
          <textarea
            className="edit-prompt-textarea"
            value={editVal}
            onChange={(e) => setEditVal(e.target.value)}
            rows={2}
          />
          <div className="flex gap-1 justify-end mt-1">
            <button className="edit-action-btn edit-action-btn--cancel" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
            <button className="edit-action-btn edit-action-btn--save" onClick={handleSave}>
              Save & Submit
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {images && images.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-1">
              {images.map((img, idx) => (
                <img
                  key={idx}
                  src={img.startsWith('data:') ? img : `data:image/png;base64,${img}`}
                  alt="attached preview"
                  className="w-16 h-16 object-cover rounded border border-neutral-200"
                />
              ))}
            </div>
          )}
          <div className="whitespace-pre-wrap">{content}</div>
        </div>
      )}

      {!isEditing && (
        <div className="absolute right-1.5 bottom-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button
            className="p-0.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
            onClick={() => setIsEditing(true)}
            title="Edit prompt"
          >
            <Edit3 size={11} />
          </button>
          <button
            className="p-0.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
            onClick={handleCopy}
            title="Copy prompt"
          >
            {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
          </button>
        </div>
      )}
    </div>
  );
};

export const Chat: React.FC<{ onEditMessage?: (index: number, newContent: string) => void }> = ({ onEditMessage }) => {
  const {
    isChatOpen,
    messages,
    petState,
  } = usePetStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isChatOpen) return null;

  const isGenerating = petState === 'Thinking' || petState === 'Talking';

  return (
    <div
      className="chat-messages-container"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-state">
            <img src="/app_icon.png" alt="Ollama Pet Logo" className="empty-logo" />
            <p>Ask anything above!</p>
            <p className="empty-hint">Responses will stream here.</p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={`message-row ${m.role === 'user' ? 'message-row--user' : 'message-row--assistant'}`}
            >
              {m.role === 'user' ? (
                <UserBubble
                  content={m.content}
                  images={m.images}
                  index={i}
                  onEdit={(idx, val) => onEditMessage?.(idx, val)}
                />
              ) : (
                <AssistantBubble 
                  content={m.content} 
                  isGenerating={isGenerating && i === messages.length - 1} 
                />
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

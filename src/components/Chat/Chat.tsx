import React, { useRef, useEffect, useState } from 'react';
import { usePetStore } from '../../stores/usePetStore';
import { Copy, Check } from 'lucide-react';
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

export const Chat: React.FC = () => {
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
            <span className="empty-emoji">🦙</span>
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
                <div className="bubble bubble--user">
                  {m.content}
                </div>
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

import React, { useRef, useEffect, useState } from 'react';
import { usePetStore } from '../../stores/usePetStore';
import { Copy, Check } from 'lucide-react';

const AssistantBubble: React.FC<{ content: string }> = ({ content }) => {
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

  return (
    <div className="bubble bubble--assistant group relative pr-8">
      {content || <span className="typing-cursor" />}
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
  } = usePetStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isChatOpen) return null;

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
                <AssistantBubble content={m.content} />
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

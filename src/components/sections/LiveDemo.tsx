'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SpriteAnimator } from '@/components/ui/SpriteAnimator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ICONS } from '@/lib/icons';
import { cn } from '@/lib/utils';
import demoData from '@/content/en/demo.json';
import commonData from '@/content/en/common.json';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export function LiveDemo() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();
  const [activeConv, setActiveConv] = useState(0);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; streaming?: boolean }>>([]);
  const [spriteState, setSpriteState] = useState<'idle' | 'thinking' | 'speaking'>('idle');
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [hasStartedAuto, setHasStartedAuto] = useState(false);

  useEffect(() => {
    if (headerVisible && !hasStartedAuto && !isStreaming && messages.length === 0) {
      setHasStartedAuto(true);
      startDemo(0);
    }
  }, [headerVisible, hasStartedAuto, isStreaming, messages.length]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const viewport = messagesEndRef.current.closest('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startDemo = async (convIndex: number) => {
    if (isStreaming) return;
    setActiveConv(convIndex);
    setIsStreaming(true);
    setMessages([]);
    setSpriteState('idle');

    const conversation = demoData.conversations[convIndex];
    
    setMessages([{ role: 'user', content: conversation.user }]);
    
    setSpriteState('thinking');
    await new Promise(r => setTimeout(r, 600));
    
    setSpriteState('speaking');
    const response = conversation.assistant;
    const words = response.split(' ');
    let streamedContent = '';
    
    setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }]);
    
    for (let i = 0; i < words.length; i++) {
      await new Promise(r => setTimeout(r, 40 + Math.random() * 30));
      streamedContent += (i === 0 ? '' : ' ') + words[i];
      setMessages(prev => prev.map((m, idx) => 
        idx === prev.length - 1 ? { ...m, content: streamedContent } : m
      ));
    }
    
    setMessages(prev => prev.map(m => m.streaming ? { ...m, streaming: false } : m));
    setSpriteState('idle');
    setIsStreaming(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isStreaming) return;
    
    const userMsg = inputValue;
    setInputValue('');
    setIsStreaming(true);
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    
    setSpriteState('thinking');
    setTimeout(() => {
      setSpriteState('speaking');
      const responses = [
        "That's a great question! Let me think...",
        "I'm running locally on your machine via Ollama.",
        "No cloud needed - everything happens right here.",
        "Want to try another model? Just ask!",
        "I can help with code, questions, or just chat."
      ];
      const response = responses[Math.floor(Math.random() * responses.length)];
      const words = response.split(' ');
      let streamed = '';
      
      setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }]);
      
      words.forEach((word, i) => {
        setTimeout(() => {
          streamed += (i === 0 ? '' : ' ') + word;
          setMessages(prev => prev.map((m, idx) => 
            idx === prev.length - 1 ? { ...m, content: streamed } : m
          ));
        }, i * 50);
      });
      
      setTimeout(() => {
        setMessages(prev => prev.map(m => m.streaming ? { ...m, streaming: false } : m));
        setSpriteState('idle');
        setIsStreaming(false);
      }, words.length * 50 + 200);
    }, 800);
  };

  const getSpriteConfig = () => {
    if (spriteState === 'speaking') return { config: demoData.speakingSprite, src: '/sprites/speaking.webp' };
    if (spriteState === 'thinking') return { config: demoData.thinkingSprite, src: '/sprites/thinking.webp' };
    return { config: demoData.idleSprite, src: '/sprites/looking.webp' };
  };

  const currentSprite = getSpriteConfig();

  return (
    <section id="demo" className="relative py-16 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden" aria-labelledby="demo-heading">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div 
          ref={headerRef}
          className={cn(
            "text-center mb-12 transition-all duration-700",
            headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/75 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            Live Demo
          </span>
          <h2 id="demo-heading" className="text-4xl lg:text-5xl font-bold tracking-tight mb-4 gradient-primary">
            {demoData.headline}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{demoData.subheadline}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left: Chat */}
          <div className="relative">
            <Card className="glass-strong min-h-[500px] max-h-[70vh] flex flex-col border-primary/10">
              <CardHeader className="flex-shrink-0 border-b bg-card/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 bg-primary/10">
                      <SpriteAnimator
                        config={currentSprite.config}
                        src={currentSprite.src}
                        className="w-full h-full"
                        autoPlay
                      />
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground">Ollama Pet</p>
                      <p className="text-xs text-muted-foreground">
                        {spriteState === 'thinking' ? 'Thinking...' : spriteState === 'speaking' ? 'Speaking...' : 'Ready'}
                      </p>
                    </div>
                  </CardTitle>
                  <span className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors',
                    spriteState === 'thinking' && 'bg-accent-gold/10 text-accent-gold animate-pulse',
                    spriteState === 'speaking' && 'bg-emerald-500/10 text-emerald-400 animate-bounce',
                    spriteState === 'idle' && 'bg-card text-muted-foreground'
                  )}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {spriteState === 'thinking' && 'Thinking'}
                    {spriteState === 'speaking' && 'Speaking'}
                    {spriteState === 'idle' && 'Idle'}
                  </span>
                </div>
              </CardHeader>

              <ScrollArea className="flex-1 p-4 space-y-4">
                {messages.map((msg, idx) => (
                  <div key={idx} className={cn('flex gap-3 mb-4', msg.role === 'user' && 'flex-row-reverse')}>
                    <Avatar className={cn(
                      "h-8 w-8 flex-shrink-0",
                      msg.role === 'user' ? "bg-primary/20 text-primary" : "bg-card border"
                    )}>
                      <AvatarFallback className="bg-transparent">
                        {msg.role === 'user' ? (
                          <ICONS.User className="h-4 w-4" />
                        ) : (
                          <SpriteAnimator
                            config={currentSprite.config}
                            src={currentSprite.src}
                            className="w-full h-full"
                            autoPlay
                          />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className={cn(
                      'max-w-[75%] rounded-2xl px-4 py-3 shadow-sm',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                        : 'bg-card text-card-foreground border rounded-tl-none'
                    )}>
                      {msg.streaming ? (
                        <span className="relative inline-block">
                          {msg.content}
                          <span className="animate-pulse ml-1 text-primary">▌</span>
                        </span>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </ScrollArea>

              <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t bg-card/50 flex-shrink-0">
                <input
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder={commonData.demo.placeholder}
                  disabled={isStreaming}
                  className="flex-1 bg-background border rounded-xl px-4 py-3 text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                />
                <Button
                  type="submit"
                  disabled={!inputValue.trim() || isStreaming}
                  className="px-6 rounded-xl"
                >
                  {isStreaming ? (
                    <span className="flex items-center gap-2">
                      <ICONS.Loader2 className="h-4 w-4 animate-spin" />
                      {commonData.demo.typing}
                    </span>
                  ) : (
                    commonData.demo.send
                  )}
                </Button>
              </form>
            </Card>
          </div>

          {/* Right: Quick demos + sprite */}
          <div className="relative">
            <div className="space-y-4 mb-12">
              {demoData.conversations.map((conv, idx) => (
                <Button
                  key={idx}
                  variant={activeConv === idx ? 'default' : 'outline'}
                  className={cn(
                    "w-full justify-start text-left h-auto py-4 px-5",
                    activeConv === idx ? "shadow-lg shadow-primary/20" : "glass hover:glass-strong text-muted-foreground"
                  )}
                  onClick={() => startDemo(idx)}
                  disabled={isStreaming}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors',
                      activeConv === idx ? 'bg-primary-foreground/20' : 'bg-primary/10'
                    )}>
                      <ICONS.MessageSquare className={cn('h-5 w-5', activeConv === idx ? 'text-primary-foreground' : 'text-primary')} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("font-medium truncate", activeConv === idx ? "text-primary-foreground" : "text-foreground")}>
                        {conv.user}
                      </p>
                    </div>
                  </div>
                </Button>
              ))}
            </div>

            {/* Sprite display */}
            <div className="relative w-[120px] mx-auto">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-primary)_0%,_transparent_60%)] opacity-10 animate-pulse-soft" />
              <SpriteAnimator
                config={currentSprite.config}
                src={currentSprite.src}
                className="w-full h-auto filter drop-shadow-[0_20px_50px_rgba(59,110,165,0.4)] transition-all duration-500"
                autoPlay
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
'use client';

import { useRef, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { SpriteAnimator } from '@/components/ui/SpriteAnimator';
import { ICONS, getIcon } from '@/lib/icons';
import { cn } from '@/lib/utils';
import techData from '@/content/en/tech.json';

export function TechStack() {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const p = 1 - (rect.top + rect.height) / (viewportHeight + rect.height);
      setProgress(Math.max(0, Math.min(1, p)));
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const spriteConfig = techData.spriteConfig;

  return (
    <section
      ref={sectionRef}
      id="tech"
      className="relative py-16 lg:py-24 px-6 overflow-hidden"
      aria-labelledby="tech-heading"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16" style={{ opacity: Math.max(0, 1 - progress * 2) }}>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/75 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            Tech Stack
          </span>
          <h2 id="tech-heading" className="text-4xl lg:text-5xl font-bold tracking-tight mb-4 gradient-primary">
            {techData.headline}
          </h2>
          <p className="text-lg text-zinc-500 max-w-2xl mx-auto">{techData.subheadline}</p>
        </div>

        {/* Main content grid */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left: Sprite */}
          <div className="relative lg:sticky lg:top-24" style={{ opacity: Math.max(0, 1 - progress * 0.5) }}>
            <div className="relative w-full max-w-md mx-auto lg:mx-0">
              {/* Laptop frame */}
              <div className="relative aspect-[16/10] rounded-xl bg-zinc-900/50 border border-zinc-700/50 p-1 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-xl" />
                
                {/* Screen */}
                <div className="relative aspect-[16/10] bg-card/30 rounded-lg overflow-hidden">
                  <SpriteAnimator
                    config={spriteConfig}
                    src="/sprites/using_laptop.webp"
                    className="w-full h-full"
                    autoPlay
                  />
                </div>

                {/* Laptop base */}
                <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-32 h-2 bg-zinc-800 rounded-t" />
              </div>

              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 flex flex-col gap-2">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 glass-strong rounded-lg border border-primary/20 text-primary text-sm font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/75 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                  Local First
                </span>
                <span className="inline-flex items-center px-3 py-1.5 glass-strong rounded-lg border border-zinc-700 text-zinc-300 text-sm font-medium">Zero Latency</span>
                <span className="inline-flex items-center px-3 py-1.5 glass-strong rounded-lg border border-zinc-700 text-zinc-300 text-sm font-medium">Privacy</span>
              </div>
            </div>
          </div>

          {/* Right: Tech cards */}
          <div className="space-y-4">
            {techData.technologies.map((tech, index) => {
              const TechIcon = getIcon(tech.icon);
              return (
                <Card
                  key={tech.name}
                  className={cn(
                    'glass group hover:glass-strong transition-all duration-300',
                    'opacity-0 translate-x-8',
                    progress > (index + 1) * 0.1 ? 'opacity-100 translate-x-0' : ''
                  )}
                  style={{ transitionDelay: `${index * 80}ms` }}
                >
                  <div className="flex items-center gap-4 p-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <TechIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{tech.name}</h3>
                      <p className="text-sm text-zinc-500">{tech.category}</p>
                    </div>
                    <span className="text-primary font-medium group-hover:translate-x-1 transition-transform">
                      <ICONS.ArrowRight className="h-5 w-5" />
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
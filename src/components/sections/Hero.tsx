'use client';

import { useState, useEffect } from 'react';
import heroData from '@/content/en/hero.json';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SpriteAnimator } from '@/components/ui/SpriteAnimator';
import { ICONS } from '@/lib/icons';

// Render particles only on client to avoid hydration mismatch
function Particles() {
  const [isMounted, setIsMounted] = useState(false);
  const [particles, setParticles] = useState<{ id: number; left: string; top: string; delay: string; duration: string }[]>([]);

  useEffect(() => {
    setIsMounted(true);
    setParticles(
      [...Array(20)].map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        delay: `${Math.random() * 5}s`,
        duration: `${8 + Math.random() * 10}s`
      }))
    );
  }, []);

  if (!isMounted) return null;

  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-1 h-1 bg-primary/30 rounded-full animate-float"
          style={{
            left: p.left,
            top: p.top,
            animationDelay: p.delay,
            animationDuration: p.duration
          }}
        />
      ))}
    </>
  );
}

export function Hero() {
  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      aria-labelledby="hero-heading"
    >
      {/* Parallax Layers */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-primary)_0%,_transparent_70%)] opacity-[0.03]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-pulse-soft" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[100px] animate-pulse-soft delay-1000" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <Particles />
      </div>

      <div className="relative z-10 text-center px-4 max-w-7xl mx-auto w-full pt-12">
        {/* Animated Sprite */}
        <div className="mb-10 relative w-[120px] mx-auto animate-scale-in">
          <SpriteAnimator
            config={heroData.spriteConfig}
            src="/sprites/waving.webp"
            className="filter drop-shadow-[0_10px_40px_rgba(59,110,165,0.4)]"
          />
        </div>

        {/* Headline */}
        <h1
          id="hero-heading"
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 gradient-primary animate-slide-up"
        >
          {heroData.headline}
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed animate-slide-up delay-100">
          {heroData.subheadline}
        </p>

        {/* Badges */}
        <div className="flex flex-wrap justify-center gap-3 mb-10 animate-slide-up delay-200">
          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 px-4 py-2 text-sm backdrop-blur-sm">
            <ICONS.Sparkles className="mr-2 h-3 w-3" />
            100% Local
          </Badge>
          <Badge className="bg-amber-600/10 text-amber-700 dark:bg-accent/10 dark:text-accent border-amber-600/20 dark:border-accent/20 hover:bg-amber-600/20 dark:hover:bg-accent/20 px-4 py-2 text-sm backdrop-blur-sm">
            Zero Telemetry
          </Badge>
          <Badge className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20 px-4 py-2 text-sm backdrop-blur-sm">
            Works Offline
          </Badge>
          <Badge className="bg-foreground/5 text-foreground border-foreground/10 hover:bg-foreground/10 px-4 py-2 text-sm backdrop-blur-sm">
            Open Source
          </Badge>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up delay-300">
          <Button
            size="lg"
            className="group w-full sm:w-auto px-8 py-6 text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(59,110,165,0.3)] hover:shadow-[0_0_30px_rgba(59,110,165,0.5)] transition-all"
            asChild
          >
            <a href="#download">
              <ICONS.Download className="mr-2 h-5 w-5" />
              {heroData.ctaPrimary}
            </a>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="group w-full sm:w-auto px-8 py-6 text-lg border-primary/30 hover:bg-primary/20 text-primary hover:text-primary glass"
            asChild
          >
            <a href="https://github.com/AMV0027/ollama-pet" target="_blank" rel="noopener noreferrer">
              <ICONS.GitHub className="mr-2 h-5 w-5" />
              {heroData.ctaSecondary}
              <ICONS.ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </a>
          </Button>
        </div>

        {/* Scroll hint */}
        <div className="mt-16 flex items-center justify-center gap-2 text-muted-foreground animate-bounce" style={{ animationDelay: '2s' }}>
          <span className="text-sm hidden md:block">{heroData.scrollHint}</span>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </section>
  );
}
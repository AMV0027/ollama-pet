'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SpriteAnimator } from '@/components/ui/SpriteAnimator';
import { getIcon, ICONS } from '@/lib/icons';
import { cn } from '@/lib/utils';
import downloadData from '@/content/en/download.json';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export function Download() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();
  const { ref: platformsRef, isVisible: platformsVisible } = useScrollReveal({ threshold: 0.2 });

  return (
    <section id="download" className="relative py-16 lg:py-24 px-6 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-card/30">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-[radial-gradient(ellipse_at_bottom,_var(--color-primary)_0%,_transparent_60%)] opacity-10" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header with Sprite */}
        <div 
          ref={headerRef}
          className={cn(
            "text-center mb-20 transition-all duration-700",
            headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <div className="mb-8 relative w-[120px] mx-auto">
            <SpriteAnimator
              config={downloadData.spriteConfig}
              src="/sprites/jumping.webp"
              className="filter drop-shadow-[0_20px_40px_rgba(59,110,165,0.4)]"
              autoPlay
            />
          </div>
          <h2 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6 gradient-primary">
            {downloadData.headline}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {downloadData.subheadline}
          </p>
        </div>

        {/* Platform Cards */}
        <div 
          ref={platformsRef}
          className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16"
        >
          {downloadData.platforms.map((platform, index) => {
            const PlatformIcon = getIcon(platform.icon);
            return (
              <Card 
                key={platform.id}
                className={cn(
                  "glass hover:glass-strong transition-all duration-500 overflow-hidden group flex flex-col items-center text-center p-8",
                  platformsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
                  `delay-${index * 100}`
                )}
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                  <PlatformIcon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-foreground">{platform.name}</h3>
                <p className="text-sm text-muted-foreground mb-6">{platform.description}</p>
                
                <Button className="w-full mb-4 bg-primary text-primary-foreground hover:bg-primary/90">
                  {platform.buttonText}
                </Button>
                
                <div className="flex gap-2 justify-center w-full">
                  {platform.arch.map((arch) => (
                    <span key={arch} className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground px-2 py-1 bg-card rounded-md border">
                      {arch}
                    </span>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Requirements */}
        <div 
          className={cn(
            "max-w-4xl mx-auto transition-all duration-700 delay-500",
            platformsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <div className="glass px-8 py-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 border-primary/20 bg-card/40">
            <div className="flex items-center gap-4 shrink-0">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <ICONS.Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-foreground text-lg">System Requirements</h4>
                <p className="text-sm text-muted-foreground">What you need to run Ollama Pet</p>
              </div>
            </div>
            <ul className="flex flex-wrap items-center justify-center md:justify-end gap-x-4 gap-y-3 text-sm font-medium text-muted-foreground">
              {downloadData.requirements.map((req, i) => (
                <li key={i} className="flex items-center gap-2 bg-background/60 px-4 py-2 rounded-full border shadow-sm">
                  <ICONS.Check className="h-4 w-4 text-emerald-500" />
                  {req}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
'use client';

import { SpriteAnimator } from '@/components/ui/SpriteAnimator';
import { ICONS } from '@/lib/icons';
import { cn } from '@/lib/utils';
import howItWorksData from '@/content/en/how-it-works.json';
import { useScrollReveal } from '@/hooks/useScrollReveal';

function StepCard({ step, index }: { step: any; index: number }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.5 });
  
  return (
    <div
      ref={ref}
      className={cn(
        "relative pl-12 transition-all duration-700",
        isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
      )}
    >
      <div className={cn(
        "absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors duration-500",
        isVisible ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border"
      )}>
        {step.number}
      </div>
      <h3 className="text-xl font-semibold mb-3 text-foreground">{step.title}</h3>
      <p className="text-muted-foreground leading-relaxed mb-12 last:mb-0">
        {step.description}
      </p>
    </div>
  );
}

export function HowItWorks() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();
  
  return (
    <section id="how-it-works" className="relative py-16 lg:py-24 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div 
          ref={headerRef}
          className={cn(
            "text-center mb-20 transition-all duration-700",
            headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4 backdrop-blur-sm">
            <ICONS.Terminal className="h-4 w-4" />
            Under the Hood
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mb-6 gradient-primary">
            {howItWorksData.headline}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {howItWorksData.subheadline}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Steps Pipeline */}
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-[15px] top-4 bottom-12 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-transparent" />
            
            <div className="space-y-4">
              {howItWorksData.steps.map((step, index) => (
                <StepCard key={step.number} step={step} index={index} />
              ))}
            </div>
          </div>

          {/* Right: Laptop Sprite with Glow */}
          <div className="relative">
            {/* Laptop Frame */}
            <div className="relative w-full max-w-md mx-auto aspect-[16/11] rounded-2xl bg-card border shadow-2xl overflow-hidden glass-border">
              {/* Screen Content */}
              <div className="absolute inset-0 bg-background/50 flex flex-col">
                {/* Fake Window Header */}
                <div className="h-8 border-b bg-card/50 flex items-center px-4 gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                {/* Sprite Container */}
                <div className="flex-1 relative flex items-end justify-center bg-card/30 pb-2">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--color-brand-cyan)_0%,_transparent_60%)] opacity-20" />
                  <SpriteAnimator
                    config={howItWorksData.spriteConfig}
                    src="/sprites/using_laptop.webp"
                    className="w-[120px]"
                    autoPlay
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
'use client';

import { Card } from '@/components/ui/card';
import { SpriteAnimator } from '@/components/ui/SpriteAnimator';
import { getIcon } from '@/lib/icons';
import { cn } from '@/lib/utils';
import privacyData from '@/content/en/privacy.json';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export function Privacy() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();
  const { ref: cardsRef, isVisible: cardsVisible } = useScrollReveal({ threshold: 0.2 });

  return (
    <section id="privacy" className="relative py-16 lg:py-24 px-6 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-card/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-destructive)_0%,_transparent_40%)] opacity-5" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div 
          ref={headerRef}
          className={cn(
            "text-center mb-20 transition-all duration-700",
            headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mb-6 text-foreground">
            {privacyData.headline}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {privacyData.subheadline}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Interactive Privacy Visual */}
          <div className="relative">
            <Card className="glass-strong border-destructive/20 overflow-hidden">
              <div className="p-8 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 to-transparent" />
                
                <div className="relative z-10 flex flex-col items-center justify-center gap-8 min-h-[300px]">
                  <div className="relative w-[120px]">
                    <SpriteAnimator
                      config={privacyData.lookingSprite}
                      src="/sprites/looking.webp"
                      className="w-full filter drop-shadow-[0_10px_30px_rgba(239,68,68,0.2)]"
                      autoPlay
                    />
                  </div>
                  
                  <div className="flex items-center gap-4 bg-card/80 backdrop-blur px-6 py-3 rounded-full border border-destructive/30">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-medium text-emerald-400">Local Environment Secure</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right: Features */}
          <div 
            ref={cardsRef}
            className="grid gap-6"
          >
            {privacyData.features.map((feature, index) => {
              const TechIcon = getIcon(feature.icon);
              return (
                <Card 
                  key={index}
                  className={cn(
                    "glass hover:glass-strong transition-all duration-500 overflow-hidden group",
                    cardsVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8",
                    `delay-${index * 100}`
                  )}
                >
                  <div className="p-6 flex gap-6">
                    <div className="w-12 h-12 rounded-xl bg-destructive/10 flex-shrink-0 flex items-center justify-center group-hover:bg-destructive/20 group-hover:scale-110 transition-all duration-300">
                      <TechIcon className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>
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
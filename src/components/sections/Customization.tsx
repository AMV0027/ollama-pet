'use client';

import { Card } from '@/components/ui/card';
import { SpriteAnimator } from '@/components/ui/SpriteAnimator';
import { getIcon } from '@/lib/icons';
import { cn } from '@/lib/utils';
import customizationData from '@/content/en/customization.json';
import { useScrollReveal } from '@/hooks/useScrollReveal';

function FeatureCard({ feature, index }: { feature: any; index: number }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.2 });
  const TechIcon = getIcon(feature.icon);

  return (
    <Card
      ref={ref}
      className={cn(
        'glass hover:glass-strong transition-all duration-500 overflow-hidden group',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
        `delay-${(index % 3) * 100 + 100}`
      )}
    >
      <div className="p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex-shrink-0 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
          <TechIcon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-1 text-foreground">{feature.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
        </div>
      </div>
    </Card>
  );
}

export function Customization() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();
  const { ref: spriteRef, isVisible: spriteVisible } = useScrollReveal({ threshold: 0.5 });

  return (
    <section id="customize" className="relative py-16 lg:py-24 px-6 overflow-hidden bg-background">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Sprite */}
          <div 
            ref={spriteRef}
            className={cn(
              "relative transition-all duration-1000",
              spriteVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
            )}
          >
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-[100px] animate-pulse-soft" />
            <div className="relative w-[120px] mx-auto">
              <SpriteAnimator
                config={customizationData.spriteConfig}
                src="/sprites/sleeping.webp"
                className="w-full filter drop-shadow-[0_10px_30px_rgba(59,110,165,0.3)]"
                autoPlay={spriteVisible}
              />
            </div>
          </div>

          {/* Right: Content */}
          <div>
            <div 
              ref={headerRef}
              className={cn(
                "mb-12 transition-all duration-700",
                headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}
            >
              <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mb-6 gradient-primary">
                {customizationData.headline}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {customizationData.subheadline}
              </p>
            </div>

            <div className="grid gap-6">
              {customizationData.features.map((feature, index) => (
                <FeatureCard key={index} feature={feature} index={index} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
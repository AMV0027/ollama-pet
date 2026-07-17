'use client';

import { useRef, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { SpriteAnimator } from '@/components/ui/SpriteAnimator';
import { getIcon } from '@/lib/icons';
import { cn } from '@/lib/utils';
import featuresData from '@/content/en/features.json';
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
      <div className="p-6">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
          <TechIcon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-3 text-foreground">{feature.title}</h3>
        <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
      </div>
    </Card>
  );
}

export function Features() {
  const containerRef = useRef<HTMLElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // Calculate progress from when top enters bottom of viewport to when bottom leaves top
      const totalDistance = viewportHeight + rect.height;
      const scrolled = viewportHeight - rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / totalDistance));
      
      setScrollProgress(progress);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section
      ref={containerRef}
      id="features"
      className="relative py-16 lg:py-24 px-6 overflow-hidden bg-background"
      aria-labelledby="features-heading"
    >
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div 
          ref={headerRef}
          className={cn(
            "text-center mb-20 transition-all duration-700",
            headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <h2 id="features-heading" className="text-4xl lg:text-5xl font-bold tracking-tight mb-6 gradient-primary">
            {featuresData.headline}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {featuresData.subheadline}
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-32">
          {featuresData.features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>

        {/* Walking Sprite Track */}
        <div className="relative w-full h-32 border-b-2 border-primary/20">
          <div 
            className="absolute bottom-0 transition-all duration-300 ease-linear w-24 md:w-32"
            style={{ 
              left: `${10 + (scrollProgress * 80)}%`,
              transform: 'translateX(-50%)' 
            }}
          >
            <SpriteAnimator
              config={featuresData.spriteConfig}
              src="/sprites/walking.webp"
              autoPlay
            />
          </div>
        </div>
      </div>
    </section>
  );
}
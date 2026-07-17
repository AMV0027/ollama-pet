'use client';

import { usePetLogic } from '@/hooks/usePetLogic';
import { SpriteAnimator } from '@/components/ui/SpriteAnimator';
import manifest from '../../../public/sprites/manifest.json';

export function DynamicPet() {
  const { position, animation, flip } = usePetLogic();

  // If position is not initialized (e.g. -100), hide the pet initially
  if (position.x === -100 && position.y === -100) {
    return null;
  }

  const config = manifest.animations[animation as keyof typeof manifest.animations];

  return (
    <div
      className="fixed z-[9999] pointer-events-none transition-transform duration-75"
      style={{
        left: 0,
        top: 0,
        transform: `translate(${position.x}px, ${position.y}px) scaleX(${flip ? -1 : 1})`,
        // Center the sprite on the coordinates
        marginLeft: '-60px',
        marginTop: '-60px',
        width: '120px',
        height: '120px',
      }}
    >
      <div className="relative w-full h-full drop-shadow-2xl">
        {/* Glow effect behind the pet */}
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse-soft" />
        <SpriteAnimator
          config={config}
          src={`/sprites/${animation}.webp`}
          className="w-full h-full relative z-10"
          autoPlay
        />
      </div>
    </div>
  );
}

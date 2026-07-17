'use client';

import { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { SpriteAnimationConfig } from '@/hooks/useSpriteAnimation';

interface SpriteAnimatorProps {
  config: SpriteAnimationConfig;
  src: string;
  className?: string;
  style?: React.CSSProperties;
  autoPlay?: boolean;
  scrollProgress?: number;
  speed?: number;
  onLoop?: () => void;
  onFrameChange?: (frame: number) => void;
  'aria-hidden'?: boolean;
}

export function SpriteAnimator({
  config,
  src,
  className = '',
  style = {},
  autoPlay = true,
  scrollProgress,
  speed = 1,
  onLoop,
  onFrameChange,
  'aria-hidden': ariaHidden = true
}: SpriteAnimatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Initial draw flag to ensure we draw the first frame even if not animating yet
  const [initialDrawDone, setInitialDrawDone] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Intersection Observer for performance
  useEffect(() => {
    if (!canvasRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { threshold: 0 }
    );
    observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, []);

  // Load image once and store in ref
  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
    };
    img.onerror = () => {
      console.warn(`Failed to load sprite: ${src}`);
    };
  }, [src]);

  // Initial draw
  useEffect(() => {
    if (imageLoaded && canvasRef.current && !initialDrawDone && imageRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, config.frameWidth, config.frameHeight);
        ctx.drawImage(
          imageRef.current,
          0, 0, config.frameWidth, config.frameHeight,
          0, 0, config.frameWidth, config.frameHeight
        );
        setInitialDrawDone(true);
      }
    }
  }, [imageLoaded, config, initialDrawDone]);

  // Animation loop (time-based)
  useEffect(() => {
    if (!canvasRef.current || !imageLoaded || prefersReducedMotion || !imageRef.current || !isVisible || !autoPlay) return;
    if (scrollProgress !== undefined) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const frameDuration = 1000 / (config.fps * speed);
    let lastTime = performance.now();
    let currentFrame = 0;
    let direction = 1;
    let rafId: number;

    const animate = (timestamp: number) => {
      if (timestamp - lastTime >= frameDuration) {
        lastTime = timestamp;

        if (config.pingPong) {
          currentFrame += direction;
          if (currentFrame >= config.frames - 1) {
            currentFrame = config.frames - 1;
            direction = -1;
            onLoop?.();
          } else if (currentFrame <= 0) {
            currentFrame = 0;
            direction = 1;
            onLoop?.();
          }
        } else {
          currentFrame = (currentFrame + 1) % config.frames;
          if (currentFrame === 0) onLoop?.();
        }

        onFrameChange?.(currentFrame);

        ctx.clearRect(0, 0, config.frameWidth, config.frameHeight);
        ctx.drawImage(
          imageRef.current!,
          currentFrame * config.frameWidth, 0, config.frameWidth, config.frameHeight,
          0, 0, config.frameWidth, config.frameHeight
        );
      }
      rafId = requestAnimationFrame(animate);
    };

    // Initialize canvas size
    canvasRef.current.width = config.frameWidth;
    canvasRef.current.height = config.frameHeight;
    rafId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rafId);
  }, [config, speed, imageLoaded, prefersReducedMotion, onLoop, onFrameChange, isVisible, autoPlay, scrollProgress]);

  // Scroll-linked frame
  useEffect(() => {
    if (scrollProgress === undefined || !canvasRef.current || !imageLoaded || !imageRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const totalFrames = config.pingPong ? (config.frames - 1) * 2 : config.frames;
    const frame = Math.floor(scrollProgress * (totalFrames - 1));
    let actualFrame = frame;
    
    if (config.pingPong) {
      if (actualFrame >= config.frames) {
        actualFrame = config.frames - 2 - (actualFrame - config.frames);
      }
    }

    ctx.clearRect(0, 0, config.frameWidth, config.frameHeight);
    ctx.drawImage(
      imageRef.current,
      actualFrame * config.frameWidth, 0, config.frameWidth, config.frameHeight,
      0, 0, config.frameWidth, config.frameHeight
    );
  }, [scrollProgress, config, imageLoaded]);

  const aspectRatio = config.frameWidth / config.frameHeight;

  if (prefersReducedMotion || !imageLoaded) {
    return (
      <div
        className={cn('sprite-animator pixelated block w-full h-auto', className)}
        style={{
          ...style,
          aspectRatio: `${config.frameWidth} / ${config.frameHeight}`,
          backgroundImage: `url(${src})`,
          backgroundPosition: `0 0`,
          backgroundSize: `${config.frames * 100}% 100%`,
          backgroundRepeat: 'no-repeat',
        }}
        aria-hidden={ariaHidden}
        role="img"
        aria-label={`Ollama Pet ${config.name} animation`}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={cn('sprite-animator pixelated block w-full h-auto', className)}
      style={{
        ...style,
        aspectRatio: `${config.frameWidth} / ${config.frameHeight}`,
        objectFit: 'contain'
      }}
      width={config.frameWidth}
      height={config.frameHeight}
      aria-hidden={ariaHidden}
      role="img"
      aria-label={`Ollama Pet ${config.name} animation`}
    />
  );
}
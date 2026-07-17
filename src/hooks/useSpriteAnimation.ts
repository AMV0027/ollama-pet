import { useEffect, useRef, useState, useCallback } from 'react';

export interface SpriteAnimationConfig {
  name: string;
  frames: number;
  fps: number;
  loop: boolean;
  pingPong: boolean;
  grid: number[] | [number, number];
  frameWidth: number;
  frameHeight: number;
  atlasWidth: number;
  atlasHeight: number;
}

export interface SpriteState {
  currentFrame: number;
  progress: number; // 0-1
  isPlaying: boolean;
  direction: 1 | -1; // for pingPong
}

export function useSpriteAnimation(
  config: SpriteAnimationConfig,
  options: {
    autoPlay?: boolean;
    scrollProgress?: number; // 0-1 for scroll-linked playback
    speed?: number;
    onLoop?: () => void;
    onFrameChange?: (frame: number) => void;
  } = {}
) {
  const { autoPlay = true, scrollProgress, speed = 1, onLoop, onFrameChange } = options;
  
  const [state, setState] = useState<SpriteState>({
    currentFrame: 0,
    progress: 0,
    isPlaying: autoPlay && !scrollProgress,
    direction: 1
  });

  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);
  const scrollProgressRef = useRef<number | undefined>(scrollProgress);

  // Update scroll progress ref
  useEffect(() => {
    scrollProgressRef.current = scrollProgress;
  }, [scrollProgress]);

  const frameDuration = 1000 / (config.fps * speed);
  const totalFrames = config.frames;
  const pingPongFrames = config.pingPong ? (totalFrames - 1) * 2 : totalFrames;

  const tick = useCallback((timestamp: number) => {
    if (scrollProgressRef.current !== undefined) {
      // Scroll-linked mode
      const progress = Math.max(0, Math.min(1, scrollProgressRef.current));
      const frameFloat = progress * (pingPongFrames - 1);
      let frame = Math.floor(frameFloat);
      
      if (config.pingPong) {
        if (frame >= totalFrames) {
          frame = totalFrames - 2 - (frame - totalFrames);
        }
      }
      
      setState(s => {
        if (s.currentFrame !== frame) {
          onFrameChange?.(frame);
        }
        return {
          ...s,
          currentFrame: frame,
          progress,
          isPlaying: true
        };
      });
    } else {
      // Time-based mode
      const delta = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;
      accumulatedTimeRef.current += delta;

      if (accumulatedTimeRef.current >= frameDuration) {
        const frameAdvance = Math.floor(accumulatedTimeRef.current / frameDuration);
        accumulatedTimeRef.current %= frameDuration;

        setState(s => {
          let newFrame = s.currentFrame;
          let newDirection = s.direction;

          if (config.pingPong) {
            newFrame += s.direction * frameAdvance;
            
            if (newFrame >= totalFrames - 1) {
              newFrame = totalFrames - 1;
              newDirection = -1;
              onLoop?.();
            } else if (newFrame <= 0) {
              newFrame = 0;
              newDirection = 1;
              onLoop?.();
            }
          } else {
            newFrame = (s.currentFrame + frameAdvance) % totalFrames;
            if (s.currentFrame + frameAdvance >= totalFrames) {
              onLoop?.();
            }
          }

          if (s.currentFrame !== newFrame) {
            onFrameChange?.(newFrame);
          }

          return {
            ...s,
            currentFrame: newFrame,
            direction: newDirection,
            progress: config.pingPong 
              ? newFrame / (totalFrames - 1) 
              : newFrame / (totalFrames - 1)
          };
        });
      }
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [config.fps, config.frames, config.pingPong, config.loop, speed, onLoop, onFrameChange]);

  useEffect(() => {
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current!);
  }, [tick]);

  const play = useCallback(() => setState(s => ({ ...s, isPlaying: true })), []);
  const pause = useCallback(() => setState(s => ({ ...s, isPlaying: false })), []);
  const reset = useCallback(() => setState({ currentFrame: 0, progress: 0, isPlaying: autoPlay, direction: 1 }), [autoPlay]);

  // Calculate background position for CSS
  const backgroundPosition = state.currentFrame * -config.frameWidth;

  return {
    ...state,
    backgroundPosition,
    play,
    pause,
    reset,
    frameStyle: {
      backgroundPosition: `${backgroundPosition}px 0`,
      width: config.frameWidth,
      height: config.frameHeight
    }
  };
}

export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  return prefersReduced;
}
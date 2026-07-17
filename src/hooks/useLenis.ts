'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Lenis from '@studio-freight/lenis';

export function useLenis(options: ConstructorParameters<typeof Lenis>[0] = {}) {
  const lenisRef = useRef<Lenis | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      ...options
    });

    lenisRef.current = lenis;
    setIsReady(true);

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return { lenis: lenisRef.current, isReady };
}

export function useSmoothScrollTo() {
  const { lenis } = useLenis();
  
  const scrollTo = useCallback((target: string | HTMLElement | number, options?: { offset?: number; duration?: number }) => {
    if (!lenis) return;
    
    if (typeof target === 'string') {
      const element = document.querySelector(target);
      if (element) lenis.scrollTo(element as HTMLElement, options);
    } else if (typeof target === 'number') {
      lenis.scrollTo(target, options);
    } else {
      lenis.scrollTo(target, options);
    }
  }, [lenis]);

  return { scrollTo, lenis };
}

export function useScrollVelocity() {
  const [velocity, setVelocity] = useState(0);
  const lastY = useRef(window.scrollY);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    const handleScroll = () => {
      const now = performance.now();
      const y = window.scrollY;
      const deltaTime = now - lastTime.current;
      const deltaY = y - lastY.current;
      
      if (deltaTime > 0) {
        setVelocity(Math.abs(deltaY) / deltaTime * 1000); // px/s
      }
      
      lastY.current = y;
      lastTime.current = now;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return velocity;
}
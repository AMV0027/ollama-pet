'use client';

import { useEffect, useRef, useState } from 'react';

export function useScrollProgress(elementRef: React.RefObject<HTMLElement>): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleScroll = () => {
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const elementHeight = rect.height;
      
      // Progress from 0 (top of element at bottom of viewport) to 1 (bottom of element at top of viewport)
      const top = rect.top;
      const bottom = rect.bottom;
      
      if (bottom <= 0 || top >= viewportHeight) {
        setProgress(top >= viewportHeight ? 0 : 1);
        return;
      }

      const visibleTop = Math.max(0, -top);
      const visibleBottom = Math.min(viewportHeight, bottom);
      const visibleHeight = visibleBottom - visibleTop;
      const progressValue = visibleHeight / (viewportHeight + elementHeight);
      
      setProgress(Math.max(0, Math.min(1, progressValue)));
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [elementRef]);

  return progress;
}

export function useSectionProgress(sectionIds: string[]): Record<string, number> {
  const [progress, setProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    const handleScroll = () => {
      const viewportHeight = window.innerHeight;
      const updates: Record<string, number> = {};

      for (const id of sectionIds) {
        const element = document.getElementById(id);
        if (!element) continue;

        const rect = element.getBoundingClientRect();
        const top = rect.top;
        const height = rect.height;

        if (height === 0) {
          updates[id] = 0;
          continue;
        }

        // Progress from 0 (top of section at bottom of viewport) to 1 (bottom of section at top of viewport)
        let p = 1 - (top + height) / (viewportHeight + height);
        p = Math.max(0, Math.min(1, p));
        updates[id] = p;
      }

      setProgress(updates);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sectionIds]);

  return progress;
}

export function useParallax(
  speed: number = 0.5,
  elementRef?: React.RefObject<HTMLElement>
): { transform: string } {
  const [offset, setOffset] = useState(0);
  const ref = elementRef || useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleScroll = () => {
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const center = rect.top + rect.height / 2;
      const distanceFromCenter = center - viewportHeight / 2;
      setOffset(distanceFromCenter * speed);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed, ref]);

  return { transform: `translate3d(0, ${offset}px, 0)` };
}

export function useMouseParallax(
  intensity: number = 10,
  elementRef?: React.RefObject<HTMLElement>
): { transform: string } {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const ref = elementRef || useRef<HTMLElement>(null);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedMotion.current = mediaQuery.matches;
    if (prefersReducedMotion.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const element = ref.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = (e.clientX - centerX) / rect.width;
      const deltaY = (e.clientY - centerY) / rect.height;
      
      setOffset({
        x: deltaX * intensity,
        y: deltaY * intensity
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [intensity, ref]);

  return { transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` };
}
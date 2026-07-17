'use client';

import { useEffect, useState } from 'react';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setReduced(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return reduced;
}

export function usePrefersContrast(): 'more' | 'less' | 'no-preference' {
  const [contrast, setContrast] = useState<'more' | 'less' | 'no-preference'>('no-preference');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: more)');
    const mediaQueryLess = window.matchMedia('(prefers-contrast: less)');
    
    const update = () => {
      if (mediaQuery.matches) setContrast('more');
      else if (mediaQueryLess.matches) setContrast('less');
      else setContrast('no-preference');
    };

    update();
    mediaQuery.addEventListener('change', update);
    mediaQueryLess.addEventListener('change', update);
    return () => {
      mediaQuery.removeEventListener('change', update);
      mediaQueryLess.removeEventListener('change', update);
    };
  }, []);

  return contrast;
}

export function useColorScheme(): 'light' | 'dark' {
  const [scheme, setScheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setScheme(mediaQuery.matches ? 'dark' : 'light');

    const handler = (event: MediaQueryListEvent) => {
      setScheme(event.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return scheme;
}
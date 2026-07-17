'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

interface SurpriseState {
  count: number;
  currentSurprise: SurpriseTier | null;
  partyMode: boolean;
  showCredits: boolean;
}

interface SurpriseTier {
  threshold: number;
  sprite: string;
  message?: string;
  action?: 'party' | 'credits';
}

const SURPRISE_TIERS: SurpriseTier[] = [
  { threshold: 1, sprite: 'waving', message: undefined },
  { threshold: 3, sprite: 'looking', message: 'Hmm?' },
  { threshold: 5, sprite: 'thinking', message: 'Really?' },
  { threshold: 10, sprite: 'jumping', message: 'You found me! 🎉', action: 'party' },
  { threshold: 25, sprite: 'using_laptop', message: 'Secret unlocked!', action: 'credits' },
  { threshold: 50, sprite: 'speaking', message: 'Okay, you win! 🏆', action: 'credits' },
];

const STORAGE_KEY = 'ollama-pet-clicks';

export function useClickSurprise() {
  const [state, setState] = useState<SurpriseState>({
    count: 0,
    currentSurprise: null,
    partyMode: false,
    showCredits: false
  });

  const surpriseTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Load persisted state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setState(prev => ({ ...prev, count: parsed.count, partyMode: parsed.partyMode }));
        } catch {
          // ignore corrupt storage
        }
      }
    }
  }, []);

  // Persist state
  const persistState = useCallback((updates: Partial<SurpriseState>) => {
    setState(prev => {
      const next = { ...prev, ...updates };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ count: next.count, partyMode: next.partyMode }));
      }
      return next;
    });
  }, []);

  const registerClick = useCallback(() => {
    // Clear existing surprise timeout
    if (surpriseTimeoutRef.current) {
      clearTimeout(surpriseTimeoutRef.current);
    }

    setState(prev => {
      const newCount = prev.count + 1;
      
      // Find highest reached tier
      const reachedTier = [...SURPRISE_TIERS]
        .reverse()
        .find(tier => newCount >= tier.threshold);

      const nextState: SurpriseState = { ...prev, count: newCount };

      if (reachedTier && (!prev.currentSurprise || reachedTier.threshold > (prev.currentSurprise?.threshold || 0))) {
        nextState.currentSurprise = reachedTier;
        
        if (reachedTier.action === 'party' && !prev.partyMode) {
          nextState.partyMode = true;
        }
        if (reachedTier.action === 'credits') {
          nextState.showCredits = true;
        }

        // Auto-hide message after 3 seconds
        surpriseTimeoutRef.current = setTimeout(() => {
          setState(s => ({ ...s, currentSurprise: null }));
        }, 3000);
      }

      return nextState;
    });
  }, []);

  const dismissCredits = useCallback(() => {
    setState(prev => ({ ...prev, showCredits: false }));
  }, []);

  const reset = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    setState({ count: 0, currentSurprise: null, partyMode: false, showCredits: false });
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (surpriseTimeoutRef.current) clearTimeout(surpriseTimeoutRef.current);
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    };
  }, []);

  return {
    ...state,
    registerClick,
    dismissCredits,
    reset,
    tiers: SURPRISE_TIERS
  };
}
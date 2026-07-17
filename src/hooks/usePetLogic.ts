'use client';

import { useState, useEffect, useRef } from 'react';

type AnimationState = 
  | 'waving'
  | 'walking'
  | 'using_laptop'
  | 'thinking'
  | 'speaking'
  | 'jumping'
  | 'sleeping'
  | 'looking';

export function usePetLogic() {
  const [animation, setAnimation] = useState<AnimationState>('waving');
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isMobile, setIsMobile] = useState(false);

  // References for mutable state that doesn't need to trigger re-renders instantly
  // but is needed inside animation frames
  const targetPos = useRef({ x: -100, y: -100 });
  const currentPos = useRef({ x: -100, y: -100 });
  
  const idleTimeout = useRef<NodeJS.Timeout | null>(null);
  const introTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Tracking for shaking (speaking state)
  const lastMousePositions = useRef<{x: number, y: number, time: number}[]>([]);

  // State overrides
  const isHovering = useRef(false);
  const isTyping = useRef(false);
  const isClicking = useRef(false);
  const isScrolling = useRef(false);

  useEffect(() => {
    // Detect mobile by checking for touch capability or small screen
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || ('ontouchstart' in window));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Initial greeting
    introTimeout.current = setTimeout(() => {
      if (!isHovering.current && !isTyping.current && !isClicking.current) {
        setAnimation('looking');
      }
    }, 3000); // Wave for 3 seconds initially

    // Initialize position off-screen, or bottom-right if mobile
    if (window.innerWidth <= 768 || ('ontouchstart' in window)) {
      const startX = window.innerWidth - 80;
      const startY = window.innerHeight - 80;
      targetPos.current = { x: startX, y: startY };
      currentPos.current = { x: startX, y: startY };
      setPosition({ x: startX, y: startY });
    } else {
      const startX = window.innerWidth / 2;
      const startY = window.innerHeight / 2;
      targetPos.current = { x: startX, y: startY };
      currentPos.current = { x: startX, y: startY };
    }

    return () => {
      window.removeEventListener('resize', checkMobile);
      if (idleTimeout.current) clearTimeout(idleTimeout.current);
      if (introTimeout.current) clearTimeout(introTimeout.current);
    };
  }, []);

  // Update animation state based on current conditions
  const updateAnimationState = (speed: number) => {
    // Prioritize explicit actions
    if (isScrolling.current) {
      setAnimation('jumping');
      return;
    }

    if (isClicking.current) {
      setAnimation('jumping');
      return;
    }
    
    if (isTyping.current) {
      setAnimation('using_laptop');
      return;
    }

    if (isHovering.current) {
      setAnimation('thinking');
      return;
    }

    // Determine animation based on speed
    if (speed > 2500) {
      setAnimation('speaking'); // "Dizzy" from shaking
    } else if (speed > 50) {
      setAnimation('walking');
    } else if (speed > 5) {
      setAnimation('looking');
    } else {
      // If we are here, we are very slow or stopped.
      // Idle state will be handled by timeout.
      // Don't interrupt if we're sleeping, waving, etc. unless we move fast enough
      setAnimation(prev => {
        if (prev === 'sleeping' || prev === 'waving') return prev;
        return 'looking';
      });
    }
  };

  const [flip, setFlip] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isMobile) return; // Don't track mouse on mobile

      // Target position offset from cursor
      let nextX = e.clientX + 40;
      let nextY = e.clientY + 40;

      // Clamp to screen boundaries (assuming ~120px sprite size, so offset 60px from edge)
      const padding = 60;
      nextX = Math.max(padding, Math.min(window.innerWidth - padding, nextX));
      nextY = Math.max(padding, Math.min(window.innerHeight - padding, nextY));

      // Determine flip direction based on horizontal movement
      const lastPos = lastMousePositions.current[lastMousePositions.current.length - 1];
      if (lastPos) {
        if (e.clientX < lastPos.x - 2) {
          setFlip(true); // Moving left
        } else if (e.clientX > lastPos.x + 2) {
          setFlip(false); // Moving right
        }
      }

      targetPos.current = { x: nextX, y: nextY };

      // Calculate speed for shake detection
      const now = performance.now();
      lastMousePositions.current.push({ x: e.clientX, y: e.clientY, time: now });
      
      // Keep only last 100ms of data for shake detection
      lastMousePositions.current = lastMousePositions.current.filter(p => now - p.time < 100);
      
      let speed = 0;
      if (lastMousePositions.current.length > 1) {
        const oldest = lastMousePositions.current[0];
        const newest = lastMousePositions.current[lastMousePositions.current.length - 1];
        const dist = Math.hypot(newest.x - oldest.x, newest.y - oldest.y);
        const timeDelta = (newest.time - oldest.time) / 1000;
        if (timeDelta > 0) speed = dist / timeDelta;
      }

      updateAnimationState(speed);

      // Reset idle timer
      if (idleTimeout.current) clearTimeout(idleTimeout.current);
      idleTimeout.current = setTimeout(() => {
        if (!isHovering.current && !isTyping.current && !isClicking.current) {
          setAnimation('sleeping');
        }
      }, 5000);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (!isMobile) return;
      const touch = e.touches[0];
      
      let nextX = touch.clientX - 40;
      let nextY = touch.clientY - 40;

      // Clamp to screen boundaries
      const padding = 60;
      nextX = Math.max(padding, Math.min(window.innerWidth - padding, nextX));
      nextY = Math.max(padding, Math.min(window.innerHeight - padding, nextY));
      
      const lastPos = lastMousePositions.current[lastMousePositions.current.length - 1];
      if (lastPos) {
        if (touch.clientX < lastPos.x - 5) setFlip(true);
        else if (touch.clientX > lastPos.x + 5) setFlip(false);
      }
      
      // Update last position for touch so subsequent touches can flip properly
      lastMousePositions.current.push({ x: touch.clientX, y: touch.clientY, time: performance.now() });

      targetPos.current = { x: nextX, y: nextY };
      
      // Jump to location
      setAnimation('jumping');
      
      // Reset idle timer
      if (idleTimeout.current) clearTimeout(idleTimeout.current);
      idleTimeout.current = setTimeout(() => {
        if (!isHovering.current && !isTyping.current && !isClicking.current) {
          setAnimation('sleeping');
        }
      }, 5000);
      
      setTimeout(() => setAnimation('looking'), 1000);
    };

    // Global interaction listeners
    const handleMouseDown = () => {
      if (isMobile) return;
      isClicking.current = true;
      setAnimation('jumping');
    };
    
    const handleMouseUp = () => {
      if (isMobile) return;
      isClicking.current = false;
      updateAnimationState(0);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, [role="button"]')) {
        isHovering.current = true;
        updateAnimationState(0);
      } else if (target.closest('input, textarea')) {
        isTyping.current = true;
        updateAnimationState(0);
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, [role="button"]')) {
        isHovering.current = false;
        updateAnimationState(0);
      } else if (target.closest('input, textarea')) {
        isTyping.current = false;
        updateAnimationState(0);
      }
    };
    
    // Scroll handling for both mobile and desktop
    let scrollDebounce: NodeJS.Timeout | null = null;
    const handleScroll = () => {
      isScrolling.current = true;
      updateAnimationState(0);
      
      if (scrollDebounce) clearTimeout(scrollDebounce);
      scrollDebounce = setTimeout(() => {
        isScrolling.current = false;
        updateAnimationState(0);
      }, 150);
      
      // Check if at absolute bottom (Easter egg)
      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 10) {
        setAnimation('waving');
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('mouseout', handleMouseOut);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mouseout', handleMouseOut);
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [isMobile]);

  // Animation frame loop for smooth trailing
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1); // Cap delta time
      lastTime = time;

      // Lerp current position towards target position
      // Using a different speed for desktop vs mobile (mobile snaps faster)
      const lerpSpeed = isMobile ? 15 : 8; 
      
      const dx = targetPos.current.x - currentPos.current.x;
      const dy = targetPos.current.y - currentPos.current.y;
      
      currentPos.current.x += dx * lerpSpeed * dt;
      currentPos.current.y += dy * lerpSpeed * dt;

      // Update state for rendering
      setPosition({ x: currentPos.current.x, y: currentPos.current.y });

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isMobile]);

  return { position, animation, flip };
}

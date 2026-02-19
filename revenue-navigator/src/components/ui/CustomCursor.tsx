import { useEffect, useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export function CustomCursor() {
  const [isHovering, setIsHovering] = useState(false);
  
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  // Smoother spring config for better performance
  const springConfig = { damping: 30, stiffness: 500 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  // Optimized hover detection
  const checkHover = useCallback((target: HTMLElement | null) => {
    if (!target) return false;
    
    // Check if element or parent is interactive
    if (
      target.tagName === 'A' ||
      target.tagName === 'BUTTON' ||
      target.closest('button') ||
      target.closest('a') ||
      target.closest('[role="button"]') ||
      target.closest('[onclick]') ||
      target.hasAttribute('href') ||
      window.getComputedStyle(target).cursor === 'pointer'
    ) {
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    let rafId: number;
    
    const moveCursor = (e: MouseEvent) => {
      // Use requestAnimationFrame for smoother updates
      if (rafId) cancelAnimationFrame(rafId);
      
      rafId = requestAnimationFrame(() => {
        cursorX.set(e.clientX);
        cursorY.set(e.clientY);
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      moveCursor(e);
      
      // Check hover state on mouse move
      const target = e.target as HTMLElement;
      setIsHovering(checkHover(target));
    };

    // Add global cursor hiding style
    const style = document.createElement('style');
    style.textContent = `
      *, *::before, *::after {
        cursor: none !important;
      }
      body {
        cursor: none !important;
      }
    `;
    document.head.appendChild(style);

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    
    // Handle mouse enter/leave for better hover detection
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      setIsHovering(checkHover(target));
    };

    document.addEventListener('mouseover', handleMouseOver, { passive: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
      document.head.removeChild(style);
    };
  }, [cursorX, cursorY, checkHover]);

  return (
    <motion.div
      className="fixed pointer-events-none z-[9999] will-change-transform"
      style={{
        x: cursorXSpring,
        y: cursorYSpring,
        left: 0,
        top: 0,
      }}
      animate={{
        scale: isHovering ? 1.4 : 1,
        rotate: isHovering ? 90 : 0,
      }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 30,
        mass: 0.5,
      }}
    >
      {/* Purple triangle with white outline */}
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
      >
        {/* White outline */}
        <path
          d="M8 5L8 19L19 12L8 5Z"
          stroke="white"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Purple fill */}
        <path
          d="M8 6L8 18L18 12L8 6Z"
          fill="#8b5cf6"
        />
      </svg>
    </motion.div>
  );
}

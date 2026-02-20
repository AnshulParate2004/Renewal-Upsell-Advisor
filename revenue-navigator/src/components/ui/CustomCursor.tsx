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
      className="fixed pointer-events-none z-[9999] will-change-transform drop-shadow-md"
      style={{
        x: cursorXSpring,
        y: cursorYSpring,
        translateX: "-50%",
        translateY: "-50%",
        left: 0,
        top: 0,
      }}
      animate={{
        scale: isHovering ? 0.9 : 1,
      }}
      transition={{
        type: 'spring',
        stiffness: 800,
        damping: 35,
        mass: 0.5,
      }}
    >
      {/* Professional Arrow Cursor with Black Border */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
      >
        <path
          d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
          fill="white"
          stroke="black"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </motion.div>
  );
}

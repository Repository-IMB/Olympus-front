import { useState, useEffect } from 'react';

export type BreakpointKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface BreakpointState {
  current: BreakpointKey;
  isMobile: boolean;    // <768px
  isTablet: boolean;    // 768-992px
  isDesktop: boolean;   // ≥992px
}

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

function calculateBreakpoint(width: number): BreakpointState {
  let current: BreakpointKey;

  if (width < 576) current = 'xs';
  else if (width < 768) current = 'sm';
  else if (width < 992) current = 'md';
  else if (width < 1200) current = 'lg';
  else current = 'xl';

  return {
    current,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 992,
    isDesktop: width >= 992,
  };
}

export function useBreakpoint(): BreakpointState {
  const [breakpoint, setBreakpoint] = useState<BreakpointState>(() =>
    calculateBreakpoint(window.innerWidth)
  );

  useEffect(() => {
    const handleResize = debounce(() => {
      setBreakpoint(calculateBreakpoint(window.innerWidth));
    }, 150);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return breakpoint;
}

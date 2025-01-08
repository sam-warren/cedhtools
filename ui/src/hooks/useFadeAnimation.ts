import { useState, useEffect, CSSProperties } from 'react';

type TransitionStyle = 
  | 'linear'
  | 'ease'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'bounce'
  | 'elastic'
  | 'spring'
  | 'smooth'
  | { cubicBezier: [number, number, number, number] };

interface FadeAnimationParams {
  isVisible: boolean;
  duration?: number;
  isInitialTransition?: boolean;
  transitionStyle?: TransitionStyle;
  scale?: boolean;
  translateY?: boolean;
}

interface FadeAnimationResult {
  fadeStyle: CSSProperties;
  isDisplayed: boolean;
}

// Transition curve examples and their behaviors:
const TRANSITION_CURVES = {
  // Linear: Constant speed from start to finish
  // progress: [0.0, 0.2, 0.4, 0.6, 0.8, 1.0]
  // timing:   [0.0, 0.2, 0.4, 0.6, 0.8, 1.0]
  linear: 'linear',

  // Ease: Gentle acceleration and deceleration
  // progress: [0.0, 0.3, 0.6, 0.8, 0.9, 1.0]
  // timing:   [0.0, 0.2, 0.4, 0.6, 0.8, 1.0]
  ease: 'ease',

  // Ease-in: Starts slow, ends fast
  // progress: [0.0, 0.1, 0.2, 0.4, 0.7, 1.0]
  // timing:   [0.0, 0.2, 0.4, 0.6, 0.8, 1.0]
  'ease-in': 'ease-in',

  // Ease-out: Starts fast, ends slow
  // progress: [0.0, 0.3, 0.6, 0.8, 0.9, 1.0]
  // timing:   [0.0, 0.2, 0.4, 0.6, 0.8, 1.0]
  'ease-out': 'ease-out',

  // Ease-in-out: Slow start and end, fast middle
  // progress: [0.0, 0.1, 0.5, 0.9, 1.0, 1.0]
  // timing:   [0.0, 0.2, 0.4, 0.6, 0.8, 1.0]
  'ease-in-out': 'ease-in-out',

  // Bounce: Slightly overshoots and bounces back
  // progress: [0.0, 0.4, 1.1, 0.9, 1.0, 1.0]
  // timing:   [0.0, 0.2, 0.4, 0.6, 0.8, 1.0]
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',

  // Elastic: Overshoots multiple times with spring effect
  // progress: [0.0, 0.3, 1.2, 0.8, 1.1, 1.0]
  // timing:   [0.0, 0.2, 0.4, 0.6, 0.8, 1.0]
  elastic: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',

  // Spring: Quick start with subtle bounce at the end
  // progress: [0.0, 0.5, 0.9, 1.1, 1.0, 1.0]
  // timing:   [0.0, 0.2, 0.4, 0.6, 0.8, 1.0]
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',

  // Smooth: Material Design standard easing
  // progress: [0.0, 0.4, 0.8, 0.9, 1.0, 1.0]
  // timing:   [0.0, 0.2, 0.4, 0.6, 0.8, 1.0]
  smooth: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
};


// TODO: Figure out why duration and transitionStyle are not being applied
export const useFadeAnimation = ({
  isVisible,
  duration = 500,
  isInitialTransition = false,
  transitionStyle = 'elastic',
  scale = false,
  translateY = false,
}: FadeAnimationParams): FadeAnimationResult => {
  const [isDisplayed, setIsDisplayed] = useState(isVisible);
  const [opacity, setOpacity] = useState(isVisible ? 1 : 0);
  const [hasTransitioned, setHasTransitioned] = useState(false);

  const getTransitionTiming = (style: TransitionStyle): string => {
    if (typeof style === 'object' && 'cubicBezier' in style) {
      const [x1, y1, x2, y2] = style.cubicBezier;
      console.log("Returning " + `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`);
      return `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`;
    }

    console.log("Returning " + TRANSITION_CURVES[style] ? TRANSITION_CURVES[style] : 'ease-in-out');
    return TRANSITION_CURVES[style] || 'ease-in-out';
  };

  useEffect(() => {
    const shouldAnimate = !hasTransitioned || !isInitialTransition;
    const transitionDuration = shouldAnimate ? duration : 0;

    if (isVisible) {
      setIsDisplayed(true);
      requestAnimationFrame(() => {
        setOpacity(1);
        if (!hasTransitioned) setHasTransitioned(true);
      });
    } else {
      setOpacity(0);
      const timeout = setTimeout(
        () => setIsDisplayed(false),
        transitionDuration,
      );
      return () => clearTimeout(timeout);
    }
  }, [isVisible, duration, hasTransitioned, isInitialTransition, transitionStyle]);

  const transforms: string[] = [];
  if (scale) {
    transforms.push(isVisible ? 'scale(1)' : 'scale(0.95)');
  }
  if (translateY) {
    transforms.push(isVisible ? 'translateY(0)' : 'translateY(10px)');
  }

  return {
    fadeStyle: {
      opacity,
      transform: transforms.length > 0 ? transforms.join(' ') : undefined,
      transition: !hasTransitioned || !isInitialTransition
        ? `all ${duration}ms ${getTransitionTiming(transitionStyle)}`
        : undefined,
    },
    isDisplayed,
  };
};

// Usage example:
/*
const { fadeStyle, isDisplayed } = useFadeAnimation({
  isVisible: true,
  duration: 300,
  transitionStyle: { cubicBezier: [0.68, -0.55, 0.265, 1.55] }, // Custom bounce
  scale: true,  // Add scale animation
  translateY: true,  // Add vertical slide
});

// Or use preset transitions:
const { fadeStyle, isDisplayed } = useFadeAnimation({
  isVisible: true,
  duration: 300,
  transitionStyle: 'spring',
});
*/
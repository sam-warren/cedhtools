
export interface UseFadeAnimationOptions {
  duration?: number;
  delay?: number;
  timingFunction?: string;
}

export const useFadeAnimation = (
  loadingState: { 
    isLoading: boolean; 
    data: any | null; 
    error: string | null 
  },
  options: UseFadeAnimationOptions = {}
) => {
  const {
    duration = 0.3,
    delay = 0,
    timingFunction = 'ease-out'
  } = options;

  // Determine the animation state
  const shouldAnimate = !loadingState.isLoading && 
                        loadingState.data !== null && 
                        loadingState.error === null;

  const fadeInStyle = shouldAnimate
    ? {
        animation: `fadeInContent ${duration}s ${timingFunction} ${delay}s forwards`,
        opacity: 0,
        display: 'inline-block'
      }
    : {};

  return {
    fadeInStyle,
    isReady: shouldAnimate
  };
};
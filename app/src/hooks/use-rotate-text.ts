import { useState, useEffect } from "react";

export function useRotateText(texts: string[], interval: number = 3000) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((current) => (current + 1) % texts.length);
        setIsAnimating(false);
      }, 700);
    }, interval);

    return () => clearInterval(timer);
  }, [texts, interval]);

  return { text: texts[currentIndex], isAnimating };
}

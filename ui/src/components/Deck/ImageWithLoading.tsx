import { useState } from 'react';
import { ANIMATION_DURATIONS } from 'src/constants/animations';

interface ImageWithLoadingProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
}

export default function ImageWithLoading({ src, alt, className = '', ...props }: ImageWithLoadingProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-${ANIMATION_DURATIONS.imageLoad}`}
        onLoad={() => setIsLoading(false)}
        {...props}
      />
    </>
  );
}
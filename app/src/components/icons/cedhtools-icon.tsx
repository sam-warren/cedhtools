
interface CEDHToolsIconProps {
  className?: string;
}

export function CEDHToolsIcon({ className }: CEDHToolsIconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 350 500" className={className} aria-hidden="true">
      <path
        d="M30 30
           L320 440
           L30 440
           L30 30"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="60"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

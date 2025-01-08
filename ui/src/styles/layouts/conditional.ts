import { SxProps } from '@mui/material';

export function conditionalStyles(
  condition: boolean,
  additionalStyles: SxProps = {},
): SxProps {
  return {
    position: 'relative',
    visibility: 'visible',
    opacity: condition ? 1 : 0,
    height: condition ? 'auto' : 0,
    overflow: condition ? 'visible' : 'hidden',
    transition: 'opacity 0.2s ease-in-out, height 0.2s ease-in-out',
    pointerEvents: condition ? 'auto' : 'none',
    ...additionalStyles,
  };
}

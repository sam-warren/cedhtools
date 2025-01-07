import GlobalStyles from '@mui/joy/GlobalStyles';
import React from 'react';

// Fade animation keyframes as a template string
export const fadeInKeyframes = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeInContent {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

// Global styles component
export const GlobalStyleProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <>
      <style>{fadeInKeyframes}</style>
      <GlobalStyles
        styles={{
          '@global': {
            // Specific selector for fade-in animations to prevent global opacity
            '.fade-in': {
              animation: 'fadeIn 0.5s ease-out forwards',
              opacity: 0,
            },
            '.fade-in-content': {
              animation: 'fadeInContent 0.5s ease-out forwards',
              opacity: 0,
            },
          },
        }}
      />
      {children}
    </>
  );
};

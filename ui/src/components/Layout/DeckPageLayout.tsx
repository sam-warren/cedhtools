import React from 'react';
import { Box } from '@mui/joy';
import { deckPageLayout } from 'src/styles';

interface DeckPageLayoutProps {
  banner: React.ReactNode;
  leftPane: React.ReactNode;
  rightPane: React.ReactNode;
}

export const DeckPageLayout: React.FC<DeckPageLayoutProps> = ({
  banner,
  leftPane,
  rightPane,
}) => (
  <Box sx={deckPageLayout.pageContainer}>
    {banner}
    <Box sx={deckPageLayout.contentWrapper}>
      <Box sx={deckPageLayout.wrapper}>
        <Box sx={deckPageLayout.leftPane}>{leftPane}</Box>
        <Box sx={deckPageLayout.rightPane}>{rightPane}</Box>
      </Box>
    </Box>
  </Box>
);
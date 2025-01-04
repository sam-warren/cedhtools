import React from 'react';
import { Box } from '@mui/joy';
import CommanderCard from 'src/components/Deck/CommanderCard';
import { ICommanderDetail } from 'src/types';

interface CommanderStackProps {
  commanders: ICommanderDetail[];
}

/**
 * Displays exactly two commanders with the second overlapping the first
 * by ~85%. The container ensures there’s enough height to push content below.
 */
const CommanderStack: React.FC<CommanderStackProps> = ({ commanders }) => {
  if (commanders.length !== 2) {
    // Fallback: if there's 1 or more than 2, just map in normal flow
    return (
      <>
        {commanders.map((cmdr) => (
          <Box key={cmdr.unique_card_id} sx={{ mb: 2 }}>
            <CommanderCard card={cmdr} />
          </Box>
        ))}
      </>
    );
  }

  return (
    <Box 
      sx={{ 
        position: 'relative',
        height: 400, 
        mb: 2 
      }}
    >
      {/* First commander in normal flow */}
      <Box>
        <CommanderCard card={commanders[0]} />
      </Box>

      {/* Second commander, absolutely positioned so it overlaps */}
      <Box
        sx={{
          position: 'absolute',
          // Lower = bigger overlap. 
          // e.g., '15%' means only 15% below the top of the parent => ~85% overlap.
          top: '10%', 
          left: 0,
          // Possibly set a zIndex if you want the second on top visually
          zIndex: 1
        }}
      >
        <CommanderCard card={commanders[1]} />
      </Box>
    </Box>
  );
};

export default CommanderStack;

import React, { useState } from 'react';
import { Box } from '@mui/joy';
import CommanderCard from 'src/components/Deck/CommanderCard';
import { ICommanderDetail } from 'src/types';

interface CommanderStackProps {
  commanders: ICommanderDetail[];
}

const CommanderStack: React.FC<CommanderStackProps> = ({ commanders }) => {
  const [topCommanderIndex, setTopCommanderIndex] = useState(1);

  if (commanders.length !== 2) {
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

  const handleMouseLeave = () => {
    setTopCommanderIndex(1);
  };

  return (
    <Box 
      sx={{ 
        position: 'relative',
        height: 400, 
        mb: 2 
      }}
      onMouseLeave={handleMouseLeave}
    >
      {commanders.map((commander, index) => (
        <Box
          key={commander.unique_card_id}
          sx={{
            position: 'absolute',
            top: index === 0 ? 0 : '8%',
            left: 0,
            zIndex: index === topCommanderIndex ? 2 : 1,
            transition: 'all 0.1s ease-in-out',
            transform: `translateY(${index === 0 ? 0 : '2%'})`,
            '&:hover': {
              zIndex: 2
            }
          }}
          onMouseEnter={() => setTopCommanderIndex(index)}
        >
          <CommanderCard card={commander} />
        </Box>
      ))}
    </Box>
  );
};

export default CommanderStack;
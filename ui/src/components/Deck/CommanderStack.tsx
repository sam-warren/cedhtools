import React, { useState } from 'react';
import { Box } from '@mui/joy';
import CommanderCard from 'src/components/Deck/CommanderCard';
import { ICommanderDetail } from 'src/types';
import { commanderStackStyles } from 'src/styles';

interface CommanderStackProps {
  commanders: ICommanderDetail[];
}

const CommanderStack: React.FC<CommanderStackProps> = ({ commanders }) => {
  if (commanders.length !== 2) {
    return (
      <>
        {commanders.map((cmdr) => (
          <Box key={cmdr.unique_card_id} sx={commanderStackStyles.singleCard}>
            <CommanderCard card={cmdr} />
          </Box>
        ))}
      </>
    );
  }

  return (
    <Box sx={commanderStackStyles.container}>
      {commanders.map((commander, index) => (
        <Box
          key={commander.unique_card_id}
          sx={commanderStackStyles.card(index)}
        >
          <CommanderCard card={commander} />
        </Box>
      ))}
    </Box>
  );
};

export default CommanderStack;
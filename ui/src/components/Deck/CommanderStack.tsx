import { Box, Typography } from '@mui/joy';
import React from 'react';
import CommanderCard from 'src/components/Deck/CommanderCard';
import { commanderStackStyles } from 'src/styles';
import { ICommanderDetail } from 'src/types';

interface CommanderStackProps {
  commanders: ICommanderDetail[];
}

const CommanderStack: React.FC<CommanderStackProps> = ({ commanders }) => {
  if (commanders.length === 0) {
    return (
      <Box>
        <Typography>No commanders found</Typography>
      </Box>
    );
  }

  if (commanders.length !== 2) {
    return (
      <>
        {commanders.map((cmdr) => {
          return (
            <Box
              key={cmdr.unique_card_id}
              sx={commanderStackStyles.singleCardContainer}
            >
              <CommanderCard card={cmdr} />
            </Box>
          );
        })}
      </>
    );
  }

  return (
    <Box sx={commanderStackStyles.container}>
      {commanders.map((commander, index) => {
        return (
          <Box
            key={commander.unique_card_id}
            sx={commanderStackStyles.card(index)}
          >
            <CommanderCard card={commander} />
          </Box>
        );
      })}
    </Box>
  );
};

export default CommanderStack;

import React from 'react';
import CommanderCard from './CommanderCard';
import { ICommanderDetail } from 'src/types';

interface CommanderStackProps {
  commanders: ICommanderDetail[];
  isInitialLoad: boolean;
}

const CommanderStack: React.FC<CommanderStackProps> = ({
  commanders,
  isInitialLoad,
}) => {
  if (isInitialLoad) {
    return (
      <div className="relative">
        <CommanderCard.Skeleton />
      </div>
    );
  }    

  if (commanders.length === 0) {
    return (
      <div className="relative">
        <CommanderCard.Skeleton />
      </div>
    );
  }

  if (commanders.length !== 2) {
    return (
      <>
        {commanders.map((cmdr) => (
          <div
            key={cmdr.unique_card_id}
            className="relative"
          >
            <CommanderCard card={cmdr} />
          </div>
        ))}
      </>
    );
  }

  return (
    <div className="relative h-[400px]">
      {commanders.map((commander, index) => (
        <div
          key={commander.unique_card_id}
          className={`absolute w-full transition-transform duration-300 ${
            index === 0 
              ? 'transform rotate-[-5deg] hover:rotate-0 z-10' 
              : 'transform rotate-[5deg] hover:rotate-0'
          }`}
        >
          <CommanderCard card={commander} />
        </div>
      ))}
    </div>
  );
};

export default CommanderStack;

import { useAppSelector } from 'src/hooks';
import CommanderStack from './CommanderStack';
import TransitionWrapper from '../Feedback/TransitionWrapper';

export default function CommanderDetails() {
  const { deck, isLoading } = useAppSelector((state) => state.deck);

  return (
    <TransitionWrapper
      loading={isLoading}
      skeleton={
        <div className="animate-pulse">
          <div className="h-[300px] bg-gray-200 dark:bg-gray-700 rounded-lg mb-4" />
        </div>
      }
    >
      {deck?.commanders && (
        <CommanderStack
          commanders={deck.commanders}
          isInitialLoad={isLoading}
        />
      )}
    </TransitionWrapper>
  );
}

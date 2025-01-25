// DeckBanner.tsx
import { Info } from 'lucide-react';
import { useAppSelector } from 'src/hooks';
import { useParams } from 'react-router-dom';
import DeckFilters from './DeckFilters';

const DeckBannerSkeleton = () => (
  <div className="h-full flex flex-col justify-center">
    <div className="flex items-center">
      <div className="h-8 w-[500px] bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
    </div>
    <div className="flex items-center mt-2">
      <div className="h-4 w-[250px] bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
    </div>
  </div>
);

const AuthorsList = ({
  authors,
}: {
  authors?: Array<{ userName: string; displayName: string }>;
}) => {
  if (!authors?.length) return null;

  return (
    <>
      created by{' '}
      {authors.map((author, index) => (
        <span key={author.userName}>
          {index > 0 && ', '}
          <a
            href={`https://www.moxfield.com/users/${author.userName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {author.displayName}
          </a>
        </span>
      ))}
    </>
  );
};

export default function DeckBanner() {
  const { deck, isLoading } = useAppSelector((state) => state.deck);
  const { deckId } = useParams();

  return (
    <div className="w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-6 flex items-center justify-between flex-shrink-0 min-h-[theme(spacing.24)]">
      {isLoading ? (
        <DeckBannerSkeleton />
      ) : (
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold flex items-center">
            {deck?.name || 'Deck not found'}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
            <AuthorsList authors={deck?.authors} />
          </p>
        </div>
      )}
      <DeckFilters />
    </div>
  );
}

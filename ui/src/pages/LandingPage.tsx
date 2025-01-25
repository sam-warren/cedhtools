import Search from 'src/components/Search/Search';
import SearchHistory from 'src/components/Search/SearchHistory';

export default function LandingPage() {
  return (
    <div className="flex flex-col justify-between items-center w-full h-full text-center px-4 pt-16">
      <div className="flex flex-col justify-start items-center w-full h-full text-center px-4">
        <h1 className="text-4xl font-bold mb-2">
          welcome to cedhtools
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          equipped with powerful statistics to improve your cEDH decks
        </p>
        <Search />
      </div>
      <div className="flex flex-col justify-end items-center w-full h-full px-4 pb-4">
        <SearchHistory />
      </div>
    </div>
  );
}

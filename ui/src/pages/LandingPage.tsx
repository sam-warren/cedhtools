import { SearchIcon } from "lucide-react";

const LandingPage = () => {
  return (
    <div className="w-full space-y-8">
      <h1 className="text-primary text-center text-4xl font-bold">cedhtools</h1>
      <div className="relative">
        <input
          type="text"
          placeholder="Enter a Moxfield Deck URL or search for a commander..."
          className="w-full rounded-lg border px-4 py-2 text-lg"
        />
        <button className="absolute top-1/2 right-4 -translate-y-1/2">
          <SearchIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default LandingPage;

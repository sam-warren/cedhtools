import { Search as SearchIcon } from 'lucide-react';
import { ChangeEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Search() {
  const [inputValue, setInputValue] = useState('');
  const navigate = useNavigate();

  const handleDecklist = async () => {
    const id = inputValue.split('/').pop()?.toString();
    navigate(`/deck/${id}`);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  return (
    <div className="flex flex-col items-center w-full pt-4">
      <div className="flex w-full max-w-[700px] relative">
        <input
          autoFocus
          placeholder="Enter a Moxfield deck link to unlock powerful data"
          value={inputValue}
          onChange={handleInputChange}
          className="w-full px-4 py-2 pl-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
        />
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <button
          onClick={handleDecklist}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
        >
          Analyze
        </button>
      </div>
    </div>
  );
}

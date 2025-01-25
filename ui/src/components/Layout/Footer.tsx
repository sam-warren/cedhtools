export default function Footer() {
  return (
    <div className="flex flex-grow justify-center">
      <div className="flex flex-row gap-1 items-center">
        <span className="text-sm text-gray-600 dark:text-gray-300">
          Powerfully driven by data from{' '}
          <a
            href="https://www.moxfield.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Moxfield
          </a>
          ,{' '}
          <a
            href="https://www.scryfall.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Scryfall
          </a>
          , and{' '}
          <a
            href="https://www.topdeck.gg"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Topdeck.gg
          </a>
        </span>
      </div>
    </div>
  );
}

import { ReactNode } from 'react';

interface BoxProps {
  children: ReactNode;
  className?: string;
}

function Root({ children, className = '' }: BoxProps) {
  return (
    <div className={`bg-background-light dark:bg-background-dark flex flex-col h-screen overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function Header({ children, className = '' }: BoxProps) {
  return (
    <header className={`p-4 gap-4 bg-white dark:bg-gray-800 flex flex-row justify-between items-center border-b border-gray-200 dark:border-gray-700 h-16 flex-shrink-0 ${className}`}>
      {children}
    </header>
  );
}

function Main({ children, className = '' }: BoxProps) {
  return (
    <main className={`flex-grow overflow-auto relative h-[calc(100vh-8rem)] ${className}`}>
      {children}
    </main>
  );
}

function Footer({ children, className = '' }: BoxProps) {
  return (
    <footer className={`p-4 gap-4 bg-white dark:bg-gray-800 flex justify-center items-center border-t border-gray-200 dark:border-gray-700 h-14 flex-shrink-0 ${className}`}>
      {children}
    </footer>
  );
}

export default {
  Root,
  Header,
  Main,
  Footer
};
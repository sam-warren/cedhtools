import React from 'react';

interface DeckPageLayoutProps {
  banner: React.ReactNode;
  leftPane: React.ReactNode;
  rightPane: React.ReactNode;
}

export const DeckPageLayout: React.FC<DeckPageLayoutProps> = ({
  banner,
  leftPane,
  rightPane,
}) => (
  <div className="flex flex-col h-full w-full overflow-hidden">
    {banner}
    <div className="flex flex-col h-[calc(100%-theme(spacing.16))] overflow-hidden">
      <div className="flex gap-4 flex-1 overflow-hidden">
        <div className="w-[300px] flex-shrink-0 p-3 overflow-y-auto">
          {leftPane}
        </div>
        <div className="flex-grow min-w-0 overflow-y-auto pb-2 pt-2 pr-4 pl-[theme(spacing.4)]">
          {rightPane}
        </div>
      </div>
    </div>
  </div>
);
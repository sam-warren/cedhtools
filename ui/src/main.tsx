import '@fontsource/inter';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import CEDHTools from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <CEDHTools />
  // </StrictMode>,
)

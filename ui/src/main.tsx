import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import '@fontsource/inter';
import CEDHTools from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CEDHTools />
  </StrictMode>,
)

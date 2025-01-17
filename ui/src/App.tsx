// App.tsx
import CssBaseline from '@mui/joy/CssBaseline';
import { CssVarsProvider } from '@mui/joy/styles';
import { Provider } from 'react-redux';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppLayout from 'src/components/Layout/AppLayout';
import Footer from 'src/components/Layout/Footer';
import Header from 'src/components/Layout/Header';
import { SearchHistoryProvider } from 'src/contexts/SearchHistoryContext';
import DeckPage from 'src/pages/DeckPage';
import LandingPage from 'src/pages/LandingPage';
import { SymbologyInitializer } from './components/Providers/SymbologyInitializer';
import { store } from './store';
import theme from './theme';

function CEDHTools() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <CssVarsProvider theme={theme}>
          <CssBaseline />
          <SearchHistoryProvider>
            <SymbologyInitializer />
            <AppLayout.Root>
              <AppLayout.Header>
                <Header />
              </AppLayout.Header>
              <AppLayout.Main>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/deck/:deckId" element={<DeckPage />} />
                  <Route path="/deck/:deckId/card/:uniqueCardId" element={<DeckPage />} />
                  <Route path="/commander/:commanderId" element={<DeckPage />} />
                  <Route path="/commander/:commanderId/card/:uniqueCardId" element={<DeckPage />} />
                  <Route path="*" element={<LandingPage />} />
                </Routes>
              </AppLayout.Main>
              <AppLayout.Footer>
                <Footer />
              </AppLayout.Footer>
            </AppLayout.Root>
          </SearchHistoryProvider>
        </CssVarsProvider>
      </BrowserRouter>
    </Provider>
  );
}

export default CEDHTools;

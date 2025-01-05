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
import { AppAlert } from './components/Feedback/AppAlert';
import AppLoader from './components/Feedback/AppLoader';
import { AlertProvider } from './contexts/AlertContext';
import { LoadingProvider } from './contexts/LoadingContext';
import { store } from './store';
import theme from './theme';

function CEDHTools() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <CssVarsProvider theme={theme}>
          <CssBaseline />
          <LoadingProvider>
            <AlertProvider>
              <SearchHistoryProvider>
                <AppLayout.Root>
                  <AppAlert />
                  <AppLayout.Header>
                    <Header />
                  </AppLayout.Header>
                  <AppLayout.Loader>
                    <AppLoader />
                  </AppLayout.Loader>
                  <AppLayout.Main>
                    <Routes>
                      <Route path="/" element={<LandingPage />} />
                      <Route path="/deck/:id" element={<DeckPage />} />
                    </Routes>
                  </AppLayout.Main>
                  <AppLayout.Footer>
                    <Footer />
                  </AppLayout.Footer>
                </AppLayout.Root>
              </SearchHistoryProvider>
            </AlertProvider>
          </LoadingProvider>
        </CssVarsProvider>
      </BrowserRouter>
    </Provider>
  );
}

export default CEDHTools;

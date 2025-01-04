import CssBaseline from '@mui/joy/CssBaseline';
import { CssVarsProvider } from '@mui/joy/styles';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Footer from 'src/components/Layout/Footer';
import Header from 'src/components/Layout/Header';
import Layout from 'src/components/Layout/Layout';
import { SearchHistoryProvider } from 'src/contexts/SearchHistoryContext';
import DeckPage from 'src/pages/DeckPage';
import LandingPage from 'src/pages/LandingPage';
import { LoadingProvider } from './contexts/LoadingContext';
import AppLoader from './components/Feedback/AppLoader';
import { AlertProvider } from './contexts/AlertContext';
import { AppAlert } from './components/Feedback/AppAlert';
import theme from './theme';

const CEDHTools = () => {
  return (
    <BrowserRouter>
      <CssVarsProvider theme={theme}>
        <CssBaseline />
        <LoadingProvider>
          <AlertProvider>
            <SearchHistoryProvider>
              <Layout.Root>
                <AppAlert />
                <Layout.Header>
                  <Header />
                </Layout.Header>
                <Layout.Loader>
                  <AppLoader />
                </Layout.Loader>
                <Layout.Main>
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/deck/:id" element={<DeckPage />} />
                  </Routes>
                </Layout.Main>
                <Layout.Footer>
                  <Footer />
                </Layout.Footer>
              </Layout.Root>
            </SearchHistoryProvider>
          </AlertProvider>
        </LoadingProvider>
      </CssVarsProvider>
    </BrowserRouter>
  );
};

export default CEDHTools;

import CssBaseline from '@mui/joy/CssBaseline';
import { CssVarsProvider } from '@mui/joy/styles';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Footer from 'src/components/Footer/Footer';
import Header from 'src/components/Header/Header';
import Layout from 'src/components/Layout/Layout';
import { SearchHistoryProvider } from 'src/contexts/SearchHistoryContext';
import DeckPage from 'src/pages/DeckPage/DeckPage';
import LandingPage from 'src/pages/LandingPage/LandingPage';

const CEDHTools = () => {
  return (
    <CssVarsProvider>
      <CssBaseline />
      <SearchHistoryProvider>
        <Layout.Root>
          <Layout.Header>
            <Header />
          </Layout.Header>
          <Layout.Main>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/deck/:id" element={<DeckPage />} />
              </Routes>
            </BrowserRouter>
          </Layout.Main>
          <Layout.Footer>
            <Footer />
          </Layout.Footer>
        </Layout.Root>
      </SearchHistoryProvider>
    </CssVarsProvider>
  );
};

export default CEDHTools;

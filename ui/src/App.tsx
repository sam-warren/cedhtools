import CssBaseline from '@mui/joy/CssBaseline';
import { CssVarsProvider } from '@mui/joy/styles';
import Footer from './components/Footer/Footer';
import Header from './components/Header/Header';
import Layout from './components/Layout/Layout';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage/LandingPage';

const CEDHTools = () => {
  return (
    <CssVarsProvider>
      <CssBaseline />
      <Layout.Root>
        <Layout.Header>
          <Header />
        </Layout.Header>
        <Layout.Main>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
            </Routes>
          </BrowserRouter>
        </Layout.Main>
        <Layout.Footer>
          <Footer />
        </Layout.Footer>
      </Layout.Root>
    </CssVarsProvider>
  );
};

export default CEDHTools;

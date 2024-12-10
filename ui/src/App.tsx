import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import LandingPage from './pages/LandingPage/LandingPage';
import DeckPage from './pages/DeckPage/DeckPage';

const App = () => {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/deck/:id" element={<DeckPage />} />
      </Routes>
    </Router>
  );
};

export default App;

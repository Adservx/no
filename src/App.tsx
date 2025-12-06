import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ManikantLanding from './pages/ManikantLanding';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ManikantLanding />} />
        <Route path="/prajols-web" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;

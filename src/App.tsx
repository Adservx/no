import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Lazy load pages for code splitting - improves initial load time
const Home = lazy(() => import('./pages/Home'));
const ManikantLanding = lazy(() => import('./pages/ManikantLanding'));
const Community = lazy(() => import('./pages/Community'));
const About = lazy(() => import('./pages/About'));

// Loading fallback component
const PageLoader = () => (
  <div className="page-loader">
    <div className="loader-spinner"></div>
    <p>Loading...</p>
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<ManikantLanding />} />
          <Route path="/prajols-web" element={<Home />} />
          <Route path="/community" element={<Community />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;

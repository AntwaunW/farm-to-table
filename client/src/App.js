// Root component — sets up React Router and maps URL paths to page components
// Layout wraps all routes so the Navbar and Footer appear on every page
// Routes with placeholder <h1> tags are pages not yet built

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.scss';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Browse from './pages/Browse';
import FarmProfile from './pages/farms/FarmProfile';

function App() {
  return (
    <Router>
      {/* Layout provides the persistent Navbar and Footer around all page content */}
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/farms/:id" element={<FarmProfile />} />
          <Route path="/dashboard" element={<h1>Dashboard</h1>} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

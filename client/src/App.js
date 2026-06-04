import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.scss';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Browse from './pages/Browse';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/farms/:id" element={<h1>Farm Profile</h1>} />
          <Route path="/dashboard" element={<h1>Dashboard</h1>} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

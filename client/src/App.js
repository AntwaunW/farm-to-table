import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.scss';
import Layout from './components/layout/Layout';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<h1>Home</h1>} />
          <Route path="/browse" element={<h1>Browse</h1>} />
          <Route path="/login" element={<h1>Login</h1>} />
          <Route path="/register" element={<h1>Register</h1>} />
          <Route path="/farms/:id" element={<h1>Farm Profile</h1>} />
          <Route path="/dashboard" element={<h1>Dashboard</h1>} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

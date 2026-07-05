// Root component — sets up React Router and maps URL paths to page components
// Layout wraps all routes so the Navbar and Footer appear on every page
// Routes with placeholder <h1> tags are pages not yet built

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import './index.scss';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Browse from './pages/Browse';
import FarmProfile from './pages/farms/FarmProfile';
import ProtectedRoute from './components/common/ProtectedRoute';
import FarmerDashboard from './pages/dashboard/FarmerDashboard';
import ConsumerDashboard from './pages/dashboard/ConsumerDashboard';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/orders/OrderConfirmation';
import CreateFarm from './pages/farms/CreateFarms';
import CreateListing from './pages/listings/CreateListing';
import Cart from './pages/Cart';
import Terms from './pages/legal/Terms';
import Privacy from './pages/legal/Privacy';
import Trademark from './pages/legal/Trademark';
import About from './pages/About';
import Contact from './pages/Contact';
import ListingDetail from './pages/listings/ListingDetail';
import MyListings from './pages/listings/MyListings';
import QuickSale from './pages/dashboard/QuickSale';
import QuickSaleClaim from './pages/orders/QuickSaleClaim';

// Farmers get their dashboard here; consumers are sent to /orders,
// which is their equivalent "My orders" page
const DashboardRouter = () => {
  const { user } = useAuth();
  if (user?.role === 'farmer') return <FarmerDashboard />;
  return <Navigate to="/orders" replace />;
};

function App() {
  return (
    <Router>
      {/* Layout provides the persistent Navbar and Footer around all page content */}
      <Layout>
        <Routes>
          {/* Public routes - anyone can access */}
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/farms/:id" element={<FarmProfile />} />
          <Route path="/listings/:id" element={<ListingDetail />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/trademark" element={<Trademark />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          {/* Public so a logged-out customer scanning a Quick Sale QR code sees a
              tailored "log in" message instead of losing the order id through the
              generic /login redirect (see QuickSaleClaim.jsx for why) */}
          <Route path="/quick-sale/:id" element={<QuickSaleClaim />} />

          {/* Protected route - must be logged in */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardRouter />} />
            <Route path="/checkout/:orderId" element={<Checkout />} />
            <Route path="/orders/:orderId/confirmation" element={<OrderConfirmation />} />
            <Route path="/farms/create" element={<CreateFarm />} />
            <Route path="/listings/create" element={<CreateListing />} />
            <Route path="/listings" element={<MyListings />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/orders" element={<ConsumerDashboard />} />
            <Route path="/quick-sale/new" element={<QuickSale />} />
          </Route>
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

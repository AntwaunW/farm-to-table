// Navbar — top navigation bar rendered on every page via Layout
// Links shown depend on auth state and user role:
//   - Logged out: Login + Sign up
//   - Consumer: My orders + Logout
//   - Farmer: Dashboard + Listings + Logout

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.scss';
import { useCart } from '../../context/CartContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { cartCount } = useCart();

  // Controls the mobile dropdown — only relevant below the tablet breakpoint,
  // where the link row no longer fits and collapses into a hamburger menu
  const [menuOpen, setMenuOpen] = useState(false);

  // Clear the session and send the user back to the home page
  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar__container">

        {/* Logo — always links back to the home page */}
        <Link to="/" className="navbar__logo">
          Cattle &amp; Crop
        </Link>

        {/* Hamburger toggle — only shown on mobile via CSS */}
        <button
          className="navbar__hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          type="button"
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        {/* Clicking any link inside closes the mobile dropdown so it never
            stays open after navigating */}
        <div
          className={`navbar__links ${menuOpen ? 'navbar__links--open' : ''}`}
          onClick={() => setMenuOpen(false)}
        >
          {/* Browse is always visible regardless of auth state */}
          <Link to="/browse" className="navbar__link">Browse farms</Link>

          {/* Show Login and Sign up only when no user is logged in */}
          {!user && (
            <>
              <Link to="/login" className="navbar__link">Login</Link>
              <Link to="/register" className="navbar__btn">Sign up</Link>
            </>
          )}

          {/* Consumer nav — access to order history */}
          {user && user.role === 'consumer' && (
            <>
              <Link to="/cart" className="navbar__link navbar__cart">
                🛒 Cart
                {cartCount > 0 && (
                  <span className="navbar__cart-badge">{cartCount}</span>
                )}
              </Link>
              <Link to="/orders" className="navbar__link">My orders</Link>
              <button onClick={handleLogout} className="navbar__link navbar__link--logout">
                Logout
              </button>
            </>
          )}

          {/* Farmer nav — access to dashboard and listing management */}
          {user && user.role === 'farmer' && (
            <>
              <Link to="/dashboard" className="navbar__link">Dashboard</Link>
              <Link to="/listings" className="navbar__link">Listings</Link>
              <button onClick={handleLogout} className="navbar__link navbar__link--logout">Logout</button>
            </>
          )}
        </div>

      </div>
    </nav>
  );
};

export default Navbar;

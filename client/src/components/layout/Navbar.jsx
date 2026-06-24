// Navbar — top navigation bar rendered on every page via Layout
// Links shown depend on auth state and user role:
//   - Logged out: Login + Sign up
//   - Consumer: My orders + Logout
//   - Farmer: Dashboard + My listings + Logout

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.scss';
import { useCart } from '../../context/CartContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { cartCount } = useCart();

  // Clear the session and send the user back to the home page
  const handleLogout = () => {
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

        <div className="navbar__links">
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
              <Link to="/browse" className="navbar__link">Browse</Link>
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
              <Link to="/listings/new" className="navbar__link">My listings</Link>
              <button onClick={handleLogout} className="navbar__link navbar__link--logout">Logout</button>
            </>
          )}
        </div>

      </div>
    </nav>
  );
};

export default Navbar;

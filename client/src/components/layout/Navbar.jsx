import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.scss';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar__container">

        <Link to="/" className="navbar__logo">
          <span className="navbar__logo-icon">🌿</span>
          FarmToTable
        </Link>

        <div className="navbar__links">
          <Link to="/browse" className="navbar__link">Browse farms</Link>

          {!user && (
            <>
              <Link to="/login" className="navbar__link">Login</Link>
              <Link to="/register" className="navbar__btn">Sign up</Link>
            </>
          )}

          {user && user.role === 'consumer' && (
            <>
              <Link to="/orders" className="navbar__link">My orders</Link>
              <button onClick={handleLogout} className="navbar__link navbar__link--logout">Logout</button>
            </>
          )}

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
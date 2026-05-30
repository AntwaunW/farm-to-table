import { Link } from 'react-router-dom';
import './Footer.scss';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer__container">

        <div className="footer__brand">
          <span className="footer__logo">🌿 FarmTable</span>
          <p className="footer__tagline">
            Connecting Texas farmers directly with local families.
          </p>
        </div>

        <div className="footer__links">
          <div className="footer__col">
            <h4 className="footer__col-title">Marketplace</h4>
            <Link to="/browse" className="footer__link">Browse farms</Link>
            <Link to="/register" className="footer__link">Join as farmer</Link>
          </div>

          <div className="footer__col">
            <h4 className="footer__col-title">Company</h4>
            <Link to="/about" className="footer__link">About us</Link>
            <Link to="/contact" className="footer__link">Contact</Link>
          </div>

          <div className="footer__col">
            <h4 className="footer__col-title">Legal</h4>
            <Link to="/terms" className="footer__link">Terms</Link>
            <Link to="/privacy" className="footer__link">Privacy</Link>
          </div>
        </div>

      </div>

      <div className="footer__bottom">
        <p className="footer__copy">© 2026 FarmTable. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
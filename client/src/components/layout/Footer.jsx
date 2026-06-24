// Footer — displayed at the bottom of every page via Layout
// Contains the brand tagline and navigation links grouped by category
// About, Contact, Terms, and Privacy pages are not yet built

import { Link } from 'react-router-dom';
import './Footer.scss';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer__container">

        {/* Brand column — logo and one-line tagline */}
        <div className="footer__brand">
          <span className="footer__logo">Cattle &amp; Crop</span>
          <p className="footer__tagline">
            Skip the store. Know your farmer.
          </p>
        </div>

        {/* Link columns — grouped by topic */}
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

      {/* Bottom bar — copyright */}
      <div className="footer__bottom">
        <p className="footer__copy">© 2026 Cattle &amp; Crop. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;

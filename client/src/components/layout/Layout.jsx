// Layout component — wraps every page with the persistent Navbar and Footer
// All route content is injected via the children prop
// Used in App.js to surround the <Routes> block

import Navbar from './Navbar';
import Footer from './Footer';
import './Layout.scss';

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <Navbar />
      {/* Page-specific content renders here */}
      <main className="layout__main">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;

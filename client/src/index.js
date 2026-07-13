// Application entry point — mounts the React app into the #root div in public/index.html
// AuthProvider wraps the entire app so authentication state is available on every page

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.scss';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

const container = document.getElementById('root');
const app = (
  <React.StrictMode>
    <AuthProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </AuthProvider>
  </React.StrictMode>
);

// Prerendered pages already have markup in #root — hydrate it instead of
// blowing it away with a fresh client render. The pristine 200.html shell
// (used for routes that weren't prerendered) has an empty #root, so it
// still takes the normal createRoot path.
if (container.hasChildNodes()) {
  ReactDOM.hydrateRoot(container, app);
} else {
  ReactDOM.createRoot(container).render(app);
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

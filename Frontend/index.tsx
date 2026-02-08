
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import { GoogleOAuthProvider } from '@react-oauth/google';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
import { BrowserRouter } from 'react-router-dom';

// REPLACE 'YOUR_GOOGLE_CLIENT_ID' WITH YOUR ACTUAL GOOGLE CLIENT ID
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="796677576146-ghrfseifff09o3fo4k0theaul0oh1kq8.apps.googleusercontent.com">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);

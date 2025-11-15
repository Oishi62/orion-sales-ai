import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './styles/index.css';
import { initializeSecureLogging } from './utils/security';
import './utils/devToolsWarning';

// Initialize secure logging to prevent sensitive data exposure
initializeSecureLogging();

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(10, 10, 10, 0.95)',
            color: '#FFFFFF',
            border: '1px solid #00F6FF',
            borderRadius: '8px',
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: '16px',
            fontWeight: '500',
          },
          success: {
            iconTheme: {
              primary: '#00F6FF',
              secondary: '#0A0A0A',
            },
          },
          error: {
            iconTheme: {
              primary: '#FF6B6B',
              secondary: '#0A0A0A',
            },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import NotificationProvider from './components/NotificationProvider';
import ToastProvider from './components/ToastProvider';
import './styles.css';
import { applyTheme, getStoredTheme } from './utils/theme';

applyTheme(getStoredTheme());

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <NotificationProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </NotificationProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

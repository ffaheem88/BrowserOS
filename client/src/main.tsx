import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles/index.css';

// Auth pages
import { LoginPage, RegisterPage } from './features/auth';

// Desktop pages
import { DesktopPage } from './features/desktop/pages/DesktopPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/auth/login" replace />} />

        {/* Authentication routes */}
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />

        {/* Desktop route (protected - will add auth guard in Task 2) */}
        <Route path="/desktop" element={<DesktopPage />} />

        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

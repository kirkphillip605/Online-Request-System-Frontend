import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import './index.css'; // Keep Tailwind's base styles and directives

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Failed to find the root element with ID 'root'");
}

// Use createRoot for React 18+
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider> {/* Provides authentication context to the entire app */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);

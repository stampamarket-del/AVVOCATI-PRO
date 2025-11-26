
import React from 'react';
import ReactDOM from 'react-dom/client';
import { SWRConfig } from 'swr';
import App from './App';
import { fetcher } from './services/api';
import { AuthProvider } from './contexts/AuthContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Impossibile trovare l'elemento root a cui montare l'applicazione");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <SWRConfig value={{ fetcher }}>
        <AuthProvider>
            <App />
        </AuthProvider>
    </SWRConfig>
  </React.StrictMode>
);

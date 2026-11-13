import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider, PomodoroProvider, TemaProvider } from './contextos';
import './estilos.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <TemaProvider>
        <AuthProvider>
          <PomodoroProvider>
            <App />
          </PomodoroProvider>
        </AuthProvider>
      </TemaProvider>
    </BrowserRouter>
  </React.StrictMode>
);

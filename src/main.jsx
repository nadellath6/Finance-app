import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import App from './App.jsx'
import instansiLogo from './assets/instansi - logo.png'
import { ToastProvider } from './components/ui/ToastProvider.jsx'

// Set favicon to instansi logo (overrides any default vite.svg)
function applyFavicon(href) {
  try {
    let link = document.querySelector('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.type = 'image/png';
    link.href = href + (href.includes('?') ? '&' : '?') + 'v=' + Date.now();
  } catch {}
}

applyFavicon(instansiLogo);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
)

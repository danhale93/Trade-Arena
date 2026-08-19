import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

function mountApp() {
  let container = document.getElementById('react-header-root');

  // If the container isn't present (static HTML missing the div), create one so the React app can mount.
  if (!container) {
    container = document.createElement('div');
    container.id = 'react-header-root';
    // Insert near the top of the body so header UI appears correctly
    if (document.body.firstChild) {
      document.body.insertBefore(container, document.body.firstChild);
    } else {
      document.body.appendChild(container);
    }
  }

  const root = createRoot(container);
  root.render(<App />);
}

// Ensure we mount after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}

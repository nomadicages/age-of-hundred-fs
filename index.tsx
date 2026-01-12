
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
const fontLink = document.createElement('link');
fontLink.href = "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

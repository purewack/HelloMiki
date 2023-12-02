import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import WebcamCatDetection from './WebcamCatDetection';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <WebcamCatDetection />
  </React.StrictMode>
);
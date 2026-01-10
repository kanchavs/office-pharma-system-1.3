import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // ตรวจสอบว่าชื่อไฟล์ App.js สะกดตรงกัน

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

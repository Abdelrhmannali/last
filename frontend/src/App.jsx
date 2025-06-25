
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import RouterComponent from './router'; // مفيش فولدر، فا بنستورد الملف مباشرة\\
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// في داخل الـ return


function App() {
  return (
    <BrowserRouter>
      <RouterComponent />
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;
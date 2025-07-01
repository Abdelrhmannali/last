import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import 'bootstrap/dist/css/bootstrap.min.css';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';



const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(

    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>

)

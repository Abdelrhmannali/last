import React from "react";
import {BrowserRouter} from "react-router-dom";
import RouterComponent from "./router"; // مفيش فولدر، فا بنستورد الملف مباشرة
import FloatingChatBot from "./components/FloatingChatBot/FloatingChatBot";

function App() {
    return (
        <BrowserRouter>
            <RouterComponent />
            {/* الشات العائم - سيظهر في جميع الصفحات */}
            <FloatingChatBot />
        </BrowserRouter>
    );
}

export default App;
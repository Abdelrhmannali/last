import React from "react";
import Sidebar from "../components/Sidebar";

export default function MainLayout({ children }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ flex: 1, background: "#f7f7fa" }}>
        {children}
      </div>
    </div>
  );
}

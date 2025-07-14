import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  FaCalendarAlt,
  FaHome,
  FaUsers,
  FaMoneyBill,
  FaBuilding,
  FaCog,
  FaSignOutAlt,
  FaUserPlus,
  FaBars,
  FaTimes,
  FaClock,
} from "react-icons/fa";
import api from "../api";
import "./Sidebar.css";

export default function Sidebar() {
  const [hr, setHr] = useState(null); // Store HR user data
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Sidebar open/close state
  const navigate = useNavigate();

  // Determine active link style
  const linkStyle = ({ isActive }) =>
    isActive ? "hrsb-nav-link active" : "hrsb-nav-link";

  // Handle logout process
  const handleLogout = async () => {
    try {
      await api.post("/hr/logout");
      localStorage.removeItem("token");

      // Prevent back navigation after logout
      window.history.pushState(null, "", window.location.href);
      window.onpopstate = function () {
        window.history.go(1);
      };

      navigate("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  // Toggle sidebar open/close
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Fetch HR user data on component mount
  useEffect(() => {
    api
      .get("/user")
      .then((res) => setHr(res.data))
      .catch((err) => console.error("Failed to fetch HR data", err));
  }, []);

  return (
    <div className="hrsb-wrapper">
      {/* Sidebar container */}
      <aside className={`hrsb-sidebar ${isSidebarOpen ? "hrsb-sidebar-open" : ""}`}>
        <div className="hrsb-sidebar-header">
          {/* Logo and title */}
         
                 <h4 className="hrsb-title">
  <img
    src="/src/assets/images/logo.png"
    alt="Pioneer Logo"
    className="hrsb-logo"
     style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%", // Make image round
                objectFit: "cover",
              }}
  />
  <span className="hrsb-brand">PIONEER HR</span>
</h4>

          {/* Sidebar toggle button */}
          <button className="hrsb-toggle-button" onClick={toggleSidebar}>
            {isSidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Navigation menu links */}
        <div className="hrsb-menu">
          <NavLink to="/dashboard" className={linkStyle} onClick={() => setIsSidebarOpen(false)}>
            <FaHome />
           Dashboard
          </NavLink>
          <NavLink to="/holidays" className={linkStyle} onClick={() => setIsSidebarOpen(false)}>
            <FaCalendarAlt />
            Holidays
          </NavLink>
          <NavLink to="/employees" className={linkStyle} onClick={() => setIsSidebarOpen(false)}>
            <FaUsers />
            Employees
          </NavLink>
          <NavLink to="/payroll" className={linkStyle} onClick={() => setIsSidebarOpen(false)}>
            <FaMoneyBill />
            Payroll
          </NavLink>
          <NavLink to="/departments" className={linkStyle} onClick={() => setIsSidebarOpen(false)}>
            <FaBuilding />
            Departments
          </NavLink>
          <NavLink to="/attendance" className={linkStyle} onClick={() => setIsSidebarOpen(false)}>
            <FaClock />
            Attendance
          </NavLink>
          <NavLink to="/settings/general" className={linkStyle} onClick={() => setIsSidebarOpen(false)}>
            <FaCog />
            Settings
          </NavLink>
          <NavLink to="/addHr" className={linkStyle} onClick={() => setIsSidebarOpen(false)}>
            <FaUserPlus />
            Add HR
          </NavLink>

          {/* Logout button */}
          <button className="hrsb-nav-link" onClick={handleLogout}>
            <FaSignOutAlt />
            Logout
          </button>
        </div>

        {/* HR profile info link */}
        {hr && (
          <NavLink
            to="/updateHr"
            className="hrsb-user-info d-flex align-items-center gap-3 text-decoration-none"
            onClick={() => setIsSidebarOpen(false)}
          >
            <img
              src={
                hr.profile_picture
                  ? `http://localhost:8000/storage/${hr.profile_picture}`
                  : "https://via.placeholder.com/100"
              }
              alt="HR"
              className="hrsb-user-avatar"
            />
            <span className="hrsb-user-name">{hr.name}</span>
          </NavLink>
        )}
      </aside>

      {/* Overlay shown on mobile when sidebar is open */}
      {isSidebarOpen && (
        <div className="hrsb-overlay" onClick={toggleSidebar}></div>
      )}

      {/* Main content area */}
      <main className="hrsb-main-content">
        {/* Mobile toggle button */}
        <button className="hrsb-mobile-toggle" onClick={toggleSidebar}>
          <FaBars />
        </button>
        <Outlet />
      </main>
    </div>
  );
}

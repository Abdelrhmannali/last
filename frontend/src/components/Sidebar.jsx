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
  const [hr, setHr] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const linkStyle = ({ isActive }) =>
    isActive ? "hrsb-nav-link active" : "hrsb-nav-link";


  const handleLogout = async () => {
    try {
      await api.post("/hr/logout");
      localStorage.removeItem("token");

      // Prevent navigating back after logout
      window.history.pushState(null, "", window.location.href);
      window.onpopstate = function () {
        window.history.go(1);
      };

      navigate("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    api
      .get("/user")
      .then((res) => setHr(res.data))
      .catch((err) => console.error("Failed to fetch HR data", err));
  }, []);

  return (
    <div className="hrsb-wrapper">
      <aside className={`hrsb-sidebar ${isSidebarOpen ? "hrsb-sidebar-open" : ""}`}>
        <div className="hrsb-sidebar-header">
          <h4 className="hrsb-title">HR System</h4>
          <button className="hrsb-toggle-button" onClick={toggleSidebar}>
            {isSidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        <div className="hrsb-menu">
          <NavLink to="/dashboard" className={linkStyle} onClick={() => setIsSidebarOpen(false)}>
            <FaHome />
            Home
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

        {/* HR profile info */}
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

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div className="hrsb-overlay" onClick={toggleSidebar}></div>
      )}

      {/* Main content */}
      <main className="hrsb-main-content">
        <button className="hrsb-mobile-toggle" onClick={toggleSidebar}>
          <FaBars />
        </button>
        <Outlet />
      </main>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  FaCalendarAlt,
  FaPlus,
  FaHome,
  FaUsers,
  FaMoneyBill,
  FaChevronDown,
  FaChevronUp,
  FaBuilding,
  FaCog,
  FaSignOutAlt,
  FaUserPlus,
} from "react-icons/fa";
import api from "../api";
import "./Sidebar.css";

export default function Sidebar() {
  const [hr, setHr] = useState(null);

  const linkStyle = ({ isActive }) =>
    isActive ? "nav-link full-button active" : "nav-link full-button";

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  useEffect(() => {
    api
      .get("/user")
      .then((res) => setHr(res.data))
      .catch((err) => console.error("Failed to fetch HR data", err));
  }, []);

  return (
    <div className="d-flex vh-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="sidebar">
        <div>
          <h4>HR System</h4>

          <div className="sidebar-menu">
            <NavLink to="/" className={linkStyle}>
              <FaHome />
              Home
            </NavLink>

            <NavLink to="/holidays" className={linkStyle}>
              <FaCalendarAlt />
              Holidays
            </NavLink>

            <NavLink to="/employees" className={linkStyle}>
              <FaUsers />
              Employees
            </NavLink>

         
            
            <NavLink to="/payroll" className={linkStyle}>
              <FaMoneyBill />
              Payroll
            </NavLink>

            <NavLink to="/departments" className={linkStyle}>
              <FaBuilding />
              Departments
            </NavLink>
            <NavLink to="/Attendance" className={linkStyle}>
              <FaBuilding />
              Attendance
            </NavLink>


            <NavLink to="/settings/general" className={linkStyle}>
              <FaCog />
              Settings
            </NavLink>

            <NavLink to="/addHr" className={linkStyle}>
              <FaUserPlus />
              Add HR
            </NavLink>

            <button onClick={handleLogout} className="nav-link full-button">
              <FaSignOutAlt />
              Logout
            </button>
          </div>
        </div>

        {/* HR Info */}
        {hr && (
          <NavLink
            to="/updateHr"
            className="sidebar-user d-flex align-items-center gap-3 mt-4 text-decoration-none"
            style={{
              padding: "12px",
              background: "rgba(255,255,255,0.08)",
              borderRadius: "12px",
            }}
          >
            <img
              src={
                hr.profile_picture
                  ? `http://localhost:8000/storage/${hr.profile_picture}`
                  : "https://via.placeholder.com/100"
              }
              alt="HR"
              style={{
                width: "50px",
                height: "50px",
                objectFit: "cover",
                borderRadius: "50%",
                border: "2px solid white",
              }}
            />
            <span
              style={{
                color: "white",
                fontWeight: "bold",
                fontSize: "1rem",
                textShadow: "0 0 5px rgba(0,0,0,0.3)",
              }}
            >
              {hr.name}
            </span>
          </NavLink>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-grow-1 p-4 bg-light" style={{ overflowY: "auto" }}>
        <Outlet />
      </main>
    </div>
  );
}

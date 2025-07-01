import React, { useState } from "react";
import { FaEnvelope, FaCheckCircle, FaUsers, FaBriefcase, FaChartLine } from "react-icons/fa";
import { Link } from "react-router-dom";
import api from "../../api";
import "./Login.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!email.trim()) {
      setError("Please enter your email.");
      toast.error("Please enter your email.", { position: "top-right", autoClose: 3000 });
      return;
    }

    try {
      await api.post("/hr/forgot-password", { email });
      setMessage("Password reset link sent! Please check your email.");
      toast.success("Password reset link sent!", { position: "top-right", autoClose: 3000 });
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to send reset link.";
      setError(errorMsg);
      toast.error(errorMsg, { position: "top-right", autoClose: 3000 });
    }
  };

  return (
    <div className="login-page">
      <ToastContainer />
      <div className="sidenav">
        <div className="login-main-text">
          <div className="hr-icons">
            <div className="icon-wrapper">
              <FaUsers className="hr-icon" />
            </div>
            <div className="icon-wrapper">
              <FaBriefcase className="hr-icon" />
            </div>
            <div className="icon-wrapper">
              <FaChartLine className="hr-icon" />
            </div>
          </div>
          <h2>Application<br />Login Page</h2>
          <p>Login or register from here to access.</p>
        </div>
      </div>
      <div className="main">
        <div className="login-container">
          <div className="header-title">
            <FaEnvelope className="header-icon" />
            <h3>Forgot Password</h3>
          </div>
          {message ? (
            <div className="success-container">
              <FaCheckCircle className="success-icon" />
              <h4>Check Your Email</h4>
              <p>{message}</p>
              <p>A password reset link has been sent to <strong>{email}</strong>. Please check your inbox (and spam/junk folder).</p>
              <Link to="/login" className="back-link">Back to Login</Link>
            </div>
          ) : (
            <form onSubmit={handleReset}>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                />
              </div>

              {error && <div className="form-error">{error}</div>}

              <div className="button-group">
                <button className="form-button btn-black" type="submit">
                  Send Reset Link
                </button>
                <Link to="/login" className="form-button btn-secondary">
                  Back to Login
                </Link>
              </div>
            </form>
          )}
          <footer>© 2025 HR Management System</footer>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
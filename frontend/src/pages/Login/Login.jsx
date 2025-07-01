import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSignInAlt, FaEye, FaEyeSlash, FaUsers, FaBriefcase, FaChartLine } from "react-icons/fa";
import api from "../../api";
import "./Login.css";
import { Alert } from "react-bootstrap";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    setMessage("");

    if (!email.trim()) {
      newErrors.email = "Please enter a valid email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email format.";
    }

    if (!password.trim()) {
      newErrors.password = "Please enter your password.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setMessage("❌ Please correct the errors in the form.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("hr/login", { email, password });
      localStorage.setItem("token", response.data.token);
      setMessage("✅ Login successful.");
      navigate("/holidays");
    } catch (error) {
      setMessage("❌ Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
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
          {loading && <div className="loading-overlay"><div className="spinner"></div></div>}

          <div className="header-title">
            <FaSignInAlt className="header-icon" />
            <h3>Welcome Back</h3>
          </div>

          {message && (
            <Alert variant={message.startsWith("✅") ? "success" : "danger"}>
              {message}
            </Alert>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <input
                  type="email"
                  placeholder="e.g., user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  disabled={loading}
                />
                <span className="input-hint">Enter your registered email</span>
              </div>
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  disabled={loading}
                />
                <span
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
              {errors.password && <div className="form-error">{errors.password}</div>}
            </div>

            <div className="form-options">
              <div className="remember-row">
                <input type="checkbox" id="remember" disabled={loading} />
                <label htmlFor="remember">Remember me</label>
              </div>
              <div className="password-row">
                <a href="/forgot-password" className="forgot-link">Forgot password?</a>
              </div>
            </div>

            <div className="button-group">
              <button className="form-button btn-black" type="submit" disabled={loading}>
                {loading ? <span className="spinner small"></span> : "Login"}
              </button>
            </div>
          </form>

          <footer>© 2025 HR Management System</footer>
        </div>
      </div>
    </div>
  );
};

export default Login;

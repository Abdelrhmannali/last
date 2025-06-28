import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSignInAlt, FaEye, FaEyeSlash } from "react-icons/fa";
import api from "../../api";
import "./Login.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

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
      toast.error("Please correct the errors in the form.", { position: "top-right", autoClose: 3000 });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("hr/login", { email, password });
      localStorage.setItem("token", response.data.token);
      toast.success("Login successful!", { position: "top-right", autoClose: 3000 });
      navigate("/holidays");
    } catch (error) {
      setErrors({
        general: "Invalid email or password.",
      });
      toast.error("Invalid email or password.", { position: "top-right", autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <ToastContainer />
      <div className="login-container glass-card">
        {loading && <div className="loading-overlay"><div className="spinner"></div></div>}
        <div className="header-title">
          <FaSignInAlt className="header-icon" />
          <h3>Welcome Back</h3>
        </div>
        {errors.general && <div className="form-error general-error">{errors.general}</div>}
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

          <button className="form-button" type="submit" disabled={loading}>
            {loading ? <span className="spinner small"></span> : "Login"}
          </button>
        </form>
        <footer>© 2025 HR Management System</footer>
      </div>
    </div>
  );
};

export default Login;
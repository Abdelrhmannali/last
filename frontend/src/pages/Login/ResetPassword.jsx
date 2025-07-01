import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FaLock, FaEye, FaEyeSlash, FaUsers, FaBriefcase, FaChartLine } from "react-icons/fa";
import api from "../../api";
import "./Login.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (password !== passwordConfirmation) {
      setError("Passwords do not match.");
      toast.error("Passwords do not match.", { position: "top-right", autoClose: 3000 });
      return;
    }

    try {
      const response = await api.post("/hr/reset-password", {
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      setMessage(response.data.message);
      toast.success(response.data.message, { position: "top-right", autoClose: 3000 });
    } catch (error) {
      const errorMsg = error.response?.data?.message || "An error occurred.";
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
            <FaLock className="header-icon" />
            <h3>Reset Password</h3>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>New Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  required
                />
                <span
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <div className="password-wrapper">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  className="form-input"
                  required
                />
                <span
                  className="toggle-password"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            {message && <div className="form-success">{message}</div>}
            {error && <div className="form-error">{error}</div>}

            <div className="button-group">
              <button className="form-button btn-black" type="submit">
                Change Password
              </button>
              <Link to="/login" className="form-button btn-secondary">
                Back to Login
              </Link>
            </div>
          </form>
          <footer>© 2025 HR Management System</footer>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
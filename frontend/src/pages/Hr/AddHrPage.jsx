import React, { useState } from "react";
import { Form, Spinner, Alert } from "react-bootstrap";
import { FaUserPlus, FaEye, FaEyeSlash } from "react-icons/fa";
import api from "../../api";
import "./HRForm.css";

export default function AddHrPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    profile_picture: null,
  });

  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "profile_picture") {
      setForm({ ...form, profile_picture: files[0] });
      setPreview(files[0] ? URL.createObjectURL(files[0]) : null);
    } else {
      setForm({ ...form, [name]: value });
    }
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (form.password !== form.confirmPassword) {
      setMessage("❌ Passwords do not match.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("email", form.email);
    formData.append("password", form.password);
    if (form.profile_picture) {
      formData.append("profile_picture", form.profile_picture);
    }

    try {
      await api.post("/hr/AddHr", formData);
      setMessage("✅ HR added successfully.");
      setForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        profile_picture: null,
      });
      setPreview(null);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to add HR!";
      setMessage("❌ " + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hr-page-wrapper">
      <div className="hr-glass-card p-4">
        <div className="header-title">
          <FaUserPlus className="header-icon" />
          <h3 className="hr-form-title">Add New HR</h3>
        </div>

        {message && (
          <Alert variant={message.startsWith("✅") ? "success" : "danger"}>
            {message}
          </Alert>
        )}

        <Form onSubmit={handleSubmit} encType="multipart/form-data" autoComplete="off">
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Enter name"
              className="form-input"
              autoComplete="off"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="Enter email"
              className="form-input"
              autoComplete="off"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <div className="password-wrapper">
              <Form.Control
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Enter password"
                className="form-input"
                autoComplete="new-password"
              />
              <span
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Confirm Password</Form.Label>
            <div className="password-wrapper">
              <Form.Control
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                value={form.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm password"
                className="form-input"
                autoComplete="new-password"
              />
              <span
                className="toggle-password"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Profile Picture</Form.Label>
            <Form.Control
              name="profile_picture"
              type="file"
              accept="image/*"
              onChange={handleChange}
              className="form-input"
            />
          </Form.Group>

          {preview && (
            <div className="text-center mb-3">
              <img src={preview} alt="Preview" className="hr-img-preview" />
            </div>
          )}

          <button type="submit" className="form-button" disabled={loading}>
            {loading ? <Spinner size="sm" animation="border" /> : "Add HR"}
          </button>
        </Form>
      </div>
    </div>
  );
}

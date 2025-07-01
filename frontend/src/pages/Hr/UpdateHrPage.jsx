import React, { useEffect, useState } from "react";
import { Form, Button, Spinner, Alert } from "react-bootstrap";
import { FaUserEdit } from "react-icons/fa";
import api from "../../api";
import "./HRForm.css";


export default function UpdateHrPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    profile_picture: null,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState(null);
  const [hrId, setHrId] = useState(null);

  // Load current HR data
  useEffect(() => {
    api
      .get("/user")
      .then((res) => {
        setForm({
          name: res.data.name,
          email: res.data.email,
          password: "",
          profile_picture: null,
        });
        setHrId(res.data.id);
        if (res.data.profile_picture) {
          setPreview(`http://localhost:8000/storage/${res.data.profile_picture}`);
        }
      })
      .catch((err) => {
        console.error("Error fetching user data:", err);
        setMessage("❌ Failed to load user data.");
       
      });
  }, []);

  // Handle field changes
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "profile_picture") {
      const file = files[0];
      setForm({ ...form, profile_picture: file });
      setPreview(file ? URL.createObjectURL(file) : null);
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const formData = new FormData();
    if (form.name.trim()) formData.append("name", form.name);
    if (form.email.trim()) formData.append("email", form.email);
    if (form.password.trim()) formData.append("password", form.password);
    if (form.profile_picture) formData.append("profile_picture", form.profile_picture);

    if ([...formData.entries()].length === 0) {
      setMessage("❌ Please update at least one field.");
     
      setLoading(false);
      return;
    }

    try {
      const response = await api.post(`/hr/update/${hrId}`, formData);
      console.log("Response:", response.data);
      setMessage("✅ HR updated successfully.");
   
    } catch (err) {
      console.error("Error:", err.response?.data || err.message);
      const errorMsg = err.response?.data?.message || "Update failed";
      setMessage("❌ Error: " + errorMsg);
    
    }

    setLoading(false);
  };

  return (
    <div className="hr-page-wrapper">
     
      <div className="hr-glass-card p-4">
        <div className="header-title">
          <FaUserEdit className="header-icon" />
          <h3 className="hr-form-title">Update HR</h3>
        </div>

        {message && <Alert variant={message.startsWith("✅") ? "success" : "danger"}>{message}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter name"
              className="form-input"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter email"
              className="form-input"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>New Password (optional)</Form.Label>
            <Form.Control
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter new password"
              className="form-input"
            />
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

          <Button
            type="submit"
            className="form-button"
            disabled={loading}
          >
            {loading ? <Spinner size="sm" animation="border" /> : "Update HR"}
          </Button>
        </Form>
      </div>
    </div>
  );
}

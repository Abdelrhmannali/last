import React, { useEffect, useState } from "react";
import { Card, Form, Button, Spinner, Alert } from "react-bootstrap";
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

  useEffect(() => {
    api.get("/user").then((res) => {
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
    });
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "profile_picture") {
      setForm({ ...form, profile_picture: files[0] });
      setPreview(URL.createObjectURL(files[0]));
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const formData = new FormData();
    for (let key in form) {
      if (form[key]) formData.append(key, form[key]);
    }

    try {
      await api.post(`/hr/update/${hrId}`, formData);
      setMessage("✅ HR updated successfully.");
    } catch (err) {
      setMessage("❌ Error: " + (err.response?.data?.message || "Failed"));
    }
    setLoading(false);
  };

  return (
    <div className="hr-page-wrapper">
      <Card className="hr-glass-card p-4">
        <h3 className="hr-form-title">Update HR</h3>
        {message && <Alert variant="info">{message}</Alert>}
        <Form onSubmit={handleSubmit} encType="multipart/form-data">
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control name="name" value={form.name} onChange={handleChange} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control name="email" type="email" value={form.email} onChange={handleChange} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>New Password (optional)</Form.Label>
            <Form.Control name="password" type="password" value={form.password} onChange={handleChange} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Profile Picture</Form.Label>
            <Form.Control name="profile_picture" type="file" accept="image/*" onChange={handleChange} />
          </Form.Group>
          {preview && (
            <div className="text-center">
              <img src={preview} alt="Preview" className="hr-img-preview" />
            </div>
          )}
          <Button type="submit" variant="primary" className="hr-btn" disabled={loading}>
            {loading ? <Spinner size="sm" animation="border" /> : "Update HR"}
          </Button>
        </Form>
      </Card>
    </div>
  );
}

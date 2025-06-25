import React, { useEffect, useState } from "react";
import {
  Button,
  Modal,
  Form,
  Badge,
  Card,
  Spinner,
} from "react-bootstrap";
import { FaCalendarPlus, FaEdit, FaTrash, FaCalendarAlt, FaCheckCircle } from "react-icons/fa";
import api from "../../api";
import "./Holiday.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editHoliday, setEditHoliday] = useState(null);
  const [form, setForm] = useState({ name: "", date: "" });
  const [formError, setFormError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [holidayToDelete, setHolidayToDelete] = useState(null);

  const formatDate = (dateStr) => {
    if (!dateStr) return "Not specified";
    const date = new Date(dateStr);
    const options = {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/holidays");
      setHolidays(data?.data || []);
      toast.success("Holidays loaded!", { position: "top-right", autoClose: 3000 });
    } catch {
      toast.error("Failed to load holidays!", { position: "top-right", autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleShowModal = (holiday = null) => {
    setEditHoliday(holiday);
    setForm(
      holiday
        ? { name: holiday.name, date: holiday.date }
        : { name: "", date: "" }
    );
    setFormError("");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditHoliday(null);
    setForm({ name: "", date: "" });
    setFormError("");
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setActionLoading(true);
    try {
      if (!form.name.trim() || !form.date) {
        setFormError("Holiday name and date are required.");
        toast.error("Holiday name and date are required!", { position: "top-right", autoClose: 3000 });
        return;
      }
      if (editHoliday) {
        await api.put(`/holidays/${editHoliday.id}`, form);
        toast.success("Holiday updated!", { position: "top-right", autoClose: 3000 });
      } else {
        await api.post("/holidays", form);
        toast.success("Holiday created!", { position: "top-right", autoClose: 3000 });
      }
      fetchHolidays();
      handleCloseModal();
    } catch {
      setFormError("Failed to save holiday!");
      toast.error("Failed to save holiday!", { position: "top-right", autoClose: 3000 });
    } finally {
      setActionLoading(false);
    }
  };

  const handleShowConfirm = (holiday) => {
    setHolidayToDelete(holiday);
    setShowConfirmModal(true);
  };

  const handleCloseConfirm = () => {
    setShowConfirmModal(false);
    setHolidayToDelete(null);
  };

  const handleDelete = async () => {
    if (!holidayToDelete) return;
    setActionLoading(true);
    try {
      await api.delete(`/holidays/${holidayToDelete.id}`);
      toast.success("Holiday deleted!", { position: "top-right", autoClose: 3000 });
      fetchHolidays();
      handleCloseConfirm();
    } catch {
      toast.error("Failed to delete holiday!", { position: "top-right", autoClose: 3000 });
      handleCloseConfirm();
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="holiday-page-wrapper">
      <ToastContainer />
      <header className="holiday-header d-flex flex-column flex-md-row justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center gap-2">
          <FaCalendarAlt className="text-primary fs-2" />
          <h2 className="holiday-section-title mb-0">Holidays</h2>
        </div>
        <Button
          variant="primary"
          className="holiday-btn-primary rounded-pill"
          onClick={() => handleShowModal()}
        >
          <FaCalendarPlus className="me-1" />
          Add Holiday
        </Button>
      </header>

      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-primary">Loading holidays...</p>
        </div>
      ) : holidays.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-muted fs-5">No holidays found.</p>
        </div>
      ) : (
        <div className="row g-3">
          {holidays.map((holiday) => (
            <div key={holiday.id} className="col-12 col-md-6 col-lg-4 slide-in">
              <Card className="holiday-square-card shadow-sm border-0">
                <Card.Body className="d-flex flex-column align-items-center justify-content-center p-3">
                  <div className="holiday-icon-circle mb-2">
                    <FaCalendarAlt className="text-primary fs-3" />
                  </div>
                  <h5 className="fw-bold mb-1 text-dark text-center">{holiday.name}</h5>
                  <div className="holiday-date-text mb-2">{formatDate(holiday.date)}</div>
                  <Badge bg="primary" className="holiday-active-badge mb-2">
                    <FaCheckCircle className="me-1" style={{ fontSize: "0.9em" }} /> Active
                  </Badge>
                  <div className="d-flex gap-2 mt-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="holiday-btn-outline-primary"
                      onClick={() => handleShowModal(holiday)}
                      disabled={actionLoading}
                    >
                      <FaEdit className="me-1" /> Edit
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="holiday-btn-outline-danger"
                      onClick={() => handleShowConfirm(holiday)}
                      disabled={actionLoading}
                    >
                      <FaTrash className="me-1" /> Delete
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      )}

      <Modal
        show={showModal}
        onHide={handleCloseModal}
        centered
        className="holiday-modal-card"
      >
        <Modal.Header className="bg-primary text-white border-0">
          <Modal.Title className="fs-5 d-flex align-items-center gap-2">
            {editHoliday ? (
              <>
                <FaEdit className="text-white" />
                Edit Holiday
              </>
            ) : (
              <>
                <FaCalendarPlus className="text-white" />
                Add Holiday
              </>
            )}
          </Modal.Title>
          <Button
            variant="link"
            onClick={handleCloseModal}
            className="text-white fs-4 p-0"
          >
            ×
          </Button>
        </Modal.Header>
        <Modal.Body className="glass-form-card">
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-2" controlId="holidayName">
              <Form.Label className="holiday-form-label">Holiday Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter holiday name"
                className="holiday-form-control"
                required
                autoFocus
              />
            </Form.Group>
            <Form.Group className="mb-2" controlId="holidayDate">
              <Form.Label className="holiday-form-label">Date</Form.Label>
              <Form.Control
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="holiday-form-control"
                required
              />
            </Form.Group>
            {formError && (
              <p className="text-danger mt-2">{formError}</p>
            )}
            <div className="d-flex justify-content-end gap-2 mt-3">
              <Button
                variant="secondary"
                onClick={handleCloseModal}
                className="holiday-btn-secondary"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                className="holiday-btn-primary"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Spinner animation="border" size="sm" />
                ) : editHoliday ? (
                  "Update"
                ) : (
                  "Create"
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal
        show={showConfirmModal}
        onHide={handleCloseConfirm}
        centered
        className="holiday-modal-card"
      >
        <Modal.Header className="bg-primary text-white border-0">
          <Modal.Title className="fs-5 d-flex align-items-center gap-2">
            <FaTrash className="text-white" />
            Confirm Deletion
          </Modal.Title>
          <Button
            variant="link"
            onClick={handleCloseConfirm}
            className="text-white fs-4 p-0"
          >
            ×
          </Button>
        </Modal.Header>
        <Modal.Body className="glass-form-card">
          <p className="mb-4">
            Are you sure you want to delete the holiday "{holidayToDelete?.name}"?
          </p>
          <div className="d-flex justify-content-end gap-2">
            <Button
              variant="secondary"
              onClick={handleCloseConfirm}
              className="holiday-btn-secondary"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              className="holiday-btn-danger"
              disabled={actionLoading}
            >
              {actionLoading ? <Spinner animation="border" size="sm" /> : "Confirm"}
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}
import React from "react";
import { Modal, Button, Row, Col, Badge } from "react-bootstrap";
import "../pages/Employees/Employee.css";

const Section = ({ title, icon, children }) => (
  <div
    className="p-3 h-100 rounded-3"
    style={{
      backgroundColor: "#fff",
      border: "2px solid #ac70c6",
      borderRadius: "15px",
      left: "50px",
    }}
  >
    <h5
      className="mb-3"
      style={{
        color: "#ac70c6",
        borderBottom: "2px solid #ac70c6",
        paddingBottom: ".5rem",
      }}
    >
      <i className={`${icon} me-2`} />
      {title}
    </h5>
    {children}
  </div>
);

const Item = ({ label, value }) => (
  <div className="mb-2">
    <strong className="text-secondary">{label}:</strong>
    <p className="mb-1 text-dark">{value}</p>
  </div>
);

export default function ShowEmployeeModal({ show, onHide, employee }) {
  if (!employee) return null;

  /* ---------- helper functions ---------- */
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "N/A");

  const fmtTime = (t) =>
    t
      ? new Date(`2000-01-01T${t}`).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "N/A";

  const weekend = () => {
    
  };

  /* ---------- JSX ---------- */
  return (
    <Modal show={show} onHide={onHide} size="lg" centered scrollable>
      <Modal.Header
        style={{
          backgroundColor: "#5a3d8c",
          color: "#fff",
          borderBottom: "none",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingLeft: "2rem",
          paddingRight: "2em",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <i className="fas fa-user-circle" style={{ fontSize: "1.2rem" }} />
          <Modal.Title style={{ fontSize: "1.25rem", margin: 0 }}>
            Employee Details
          </Modal.Title>
        </div>

        <Button
          variant="link"
          onClick={onHide}
          style={{
            color: "#fff",
            fontSize: "1.8rem",
            textDecoration: "none",
            lineHeight: "1",
          }}
        >
          &times;
        </Button>
      </Modal.Header>

      {/* ---------------- Body ---------------- */}
      <Modal.Body
        style={{
          backgroundColor: "#f8f9fa",
          maxHeight: "70vh",
          overflowY: "auto",
        }}
      >
        {/* الجزء العلوي (الصورة + الاسم + القسم) */}
        <div className="text-center mb-3">
          <div
            style={{
              border: "3px solid #ac70c6",
              borderRadius: "50%",
              padding: "3px",
              display: "inline-block",
            }}
          >
            <img
              src={`http://127.0.0.1:8000/storage/${employee.profile_picture}`}
              alt="profile"
              width="90"
              height="90"
              className="rounded-circle"
              style={{ objectFit: "cover" }}
            />
          </div>

          <h5
            className="mt-2 mb-1 fw-bold"
            style={{ color: "#ac70c6", fontSize: "1.1rem" }}
          >
            {employee.first_name} {employee.last_name}
          </h5>

          <Badge
            bg="primary"
            className="px-2 py-1"
            style={{ fontSize: ".75rem" }}
          >
            {employee.department?.dept_name ?? "Undefined"}
          </Badge>
        </div>

        <Row className="g-4">
          {/* ------ PERSONAL INFO ------ */}
          <Col md={6}>
            <Section title="Personal Info" icon="fas fa-id-card">
              <Item label="Email" value={employee.email} />
              <Item label="Phone" value={employee.phone} />
              <Item label="Birthdate" value={fmtDate(employee.birthdate)} />
              <Item label="Gender" value={employee.gender} />
              <Item label="National ID" value={employee.national_id} />
              <Item label="Nationality" value={employee.nationality} />
              <Item label="Address" value={employee.address || "N/A"} />
            </Section>
          </Col>

          {/* ------ JOB INFO ------ */}
          <Col md={6}>
            <Section title="Job Info" icon="fas fa-briefcase">
              <Item
                label="Salary"
                value={
                  <span className="text-success fw-bold">
                    {parseFloat(employee.salary).toLocaleString()} EGP
                  </span>
                }
              />

              <Item label="Hire date" value={fmtDate(employee.hire_date)} />
              <Item
                label="Working hrs/day"
                value={`${employee.working_hours_per_day} hrs`}
              />
              <Item
                label="Check-in"
                value={fmtTime(employee.default_check_in_time)}
              />
              <Item
                label="Check-out"
                value={fmtTime(employee.default_check_out_time)}
              />
             
            </Section>
          </Col>
        </Row>
      </Modal.Body>

      {/* ---------------- Footer ---------------- */}
      <Modal.Footer style={{ backgroundColor: "#f8f9fa", borderTop: "none" }}>
        <Button
          variant="outline-secondary"
          onClick={onHide}
          style={{
            borderColor: "#ac70c6",
            color: "#ac70c6",
            fontWeight: "bold",
            padding: ".5rem 2rem",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "#ac70c6";
            e.target.style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "transparent";
            e.target.style.color = "#ac70c6";
          }}
        >
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
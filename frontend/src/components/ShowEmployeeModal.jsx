import React from "react";
import { Modal, Button } from "react-bootstrap";

export default function ShowEmployeeModal({ show, onHide, employee }) {
    if (!employee) return null;

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Employee Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <img
                    src={`http://127.0.0.1:8000/storage/${employee.profile_picture}`}
                    width="100"
                    className="mb-3"
                    alt=""
                />
                <p>
                    <strong>Name:</strong> {employee.first_name}{" "}
                    {employee.last_name}
                </p>
                <p>
                    <strong>Email:</strong> {employee.email}
                </p>
                <p>
                    <strong>Phone:</strong> {employee.phone}
                </p>
                <p>
                    <strong>Salary:</strong> {employee.salary}
                </p>
                <p>
                    <strong>Department:</strong>{" "}
                    {employee.department?.dept_name}
                </p>
                <p>
                    <strong>Address:</strong> {employee.address || "N/A"}
                </p>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
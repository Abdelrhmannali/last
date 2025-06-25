import React, { useEffect, useState, useMemo } from "react";
import {
  Button,
  Modal,
  Form,
  Card,
  Spinner,
  Table,
  Image,
} from "react-bootstrap";
import { FaBuilding, FaEdit, FaTrash, FaPlus, FaUsers, FaUser } from "react-icons/fa";
import api from "../../api";
import "./Department.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editDepartment, setEditDepartment] = useState(null);
  const [form, setForm] = useState({ dept_name: "" });
  const [formError, setFormError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [employeeSearch, setEmployeeSearch] = useState("");

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/departments-with-employees");
      setDepartments(data.data || []);
      toast.success("Departments loaded!", { position: "top-right", autoClose: 3000 });
    } catch {
      toast.error("Failed to load departments!", { position: "top-right", autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async (departmentId, page = 1) => {
    setEmployeesLoading(true);
    try {
      const { data } = await api.get(`/employees?page=${page}`);
      const filteredEmployees = data.data.filter(emp => emp.department_id === departmentId);
      setEmployees(filteredEmployees);
      setCurrentPage(data.current_page);
      setTotalPages(data.last_page);
      toast.success("Employees loaded!", { position: "top-right", autoClose: 2000 });
    } catch {
      toast.error("Failed to load employees!", { position: "top-right", autoClose: 3000 });
    } finally {
      setEmployeesLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleShowModal = (department = null) => {
    setEditDepartment(department);
    setForm(department ? { dept_name: department.dept_name } : { dept_name: "" });
    setFormError("");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditDepartment(null);
    setForm({ dept_name: "" });
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
      if (!form.dept_name.trim()) {
        setFormError("Department name is required.");
        toast.error("Department name is required!", { position: "top-right", autoClose: 3000 });
        return;
      }
      if (editDepartment) {
        await api.put(`/departments/${editDepartment.id}`, form);
        toast.success("Department updated!", { position: "top-right", autoClose: 3000 });
      } else {
        await api.post("/departments", form);
        toast.success("Department created!", { position: "top-right", autoClose: 3000 });
      }
      fetchDepartments();
      handleCloseModal();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to save department!";
      setFormError(errorMsg);
      toast.error(errorMsg, { position: "top-right", autoClose: 4000 });
    } finally {
      setActionLoading(false);
    }
  };

  const handleShowConfirm = (department) => {
    setDepartmentToDelete(department);
    setShowConfirmModal(true);
  };

  const handleCloseConfirm = () => {
    setShowConfirmModal(false);
    setDepartmentToDelete(null);
  };

  const handleDelete = async () => {
    if (!departmentToDelete) return;
    setActionLoading(true);
    try {
      await api.delete(`/departments/${departmentToDelete.id}`);
      toast.success("Department deleted!", { position: "top-right", autoClose: 3000 });
      fetchDepartments();
      handleCloseConfirm();
    } catch {
      toast.error("Failed to delete department!", { position: "top-right", autoClose: 3000 });
      handleCloseConfirm();
    } finally {
      setActionLoading(false);
    }
  };

  const handleShowDetails = (department) => {
    setSelectedDepartment(department);
    fetchEmployees(department.id);
    setShowDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedDepartment(null);
    setEmployees([]);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && selectedDepartment) {
      fetchEmployees(selectedDepartment.id, page);
    }
  };

  const filteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return employees;
    return employees.filter(emp =>
      (`${emp.first_name} ${emp.last_name}`.toLowerCase().includes(employeeSearch.trim().toLowerCase()))
    );
  }, [employees, employeeSearch]);

  return (
    <div className="department-page-wrapper">
      <ToastContainer />
      <header className="department-header d-flex flex-column flex-md-row justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center gap-2">
          <FaBuilding className="text-primary fs-2" />
          <h2 className="department-section-title mb-0">Departments</h2>
        </div>
        <Button
          variant="primary"
          className="department-btn-primary rounded-pill"
          onClick={() => handleShowModal()}
        >
          <FaPlus className="me-1" />
          Add Department
        </Button>
      </header>

      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-primary">Loading departments...</p>
        </div>
      ) : departments.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-muted fs-5">No departments found.</p>
        </div>
      ) : (
        <div className="row g-2">
          {departments.map((department) => (
            <div key={department.id} className="col-12 col-md-6 col-lg-4 slide-in">
              <Card className="department-glass-card">
                <Card.Body className="d-flex flex-column gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <FaBuilding className="text-accent" />
                    <h5 className="department-card-title mb-0">{department.dept_name}</h5>
                  </div>
                  <p className="department-info-text mb-0">
                    Employees: {department.employees?.length || 0}
                  </p>
                  <div className="d-flex gap-2 mt-auto">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="department-btn-outline-primary flex-grow-1"
                      onClick={() => handleShowModal(department)}
                      disabled={actionLoading}
                    >
                      <FaEdit className="me-1" /> Edit
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="department-btn-outline-danger flex-grow-1"
                      onClick={() => handleShowConfirm(department)}
                      disabled={actionLoading}
                    >
                      <FaTrash className="me-1" /> Delete
                    </Button>
                    <Button
                      variant="outline-info"
                      size="sm"
                      className="department-btn-outline-info flex-grow-1"
                      onClick={() => handleShowDetails(department)}
                      disabled={actionLoading}
                    >
                      <FaUsers className="me-1" /> Details
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
        className="department-modal-card"
      >
        <Modal.Header className="modal-header border-0">
          <Modal.Title className="fs-5 d-flex align-items-center gap-2">
            {editDepartment ? (
              <>
                <FaEdit className="text-white" />
                Edit Department
              </>
            ) : (
              <>
                <FaPlus className="text-white" />
                Add Department
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
            <Form.Group className="mb-2" controlId="departmentName">
              <Form.Label className="department-form-label">Department Name</Form.Label>
              <Form.Control
                type="text"
                name="dept_name"
                value={form.dept_name}
                onChange={handleChange}
                placeholder="Enter department name"
                className="department-form-control"
                required
                autoFocus
              />
            </Form.Group>
            {formError && (
              <p className="text-danger mt-2">{formError}</p>
            )}
            <div className="d-flex justify-content-end gap-2 mt-3">
              <Button
                variant="secondary"
                onClick={handleCloseModal}
                className="department-btn-secondary"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                className="department-btn-primary"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Spinner animation="border" size="sm" />
                ) : editDepartment ? (
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
        show={showDetailsModal}
        onHide={handleCloseDetailsModal}
        centered
        className="department-modal-card department-details-modal"
      >
        <Modal.Header className="modal-header border-0">
          <Modal.Title className="fs-5 d-flex align-items-center gap-2">
            <FaUsers className="text-white" />
            Department Details: {selectedDepartment?.dept_name}
          </Modal.Title>
          <Button
            variant="link"
            onClick={handleCloseDetailsModal}
            className="text-white fs-4 p-0"
          >
            ×
          </Button>
        </Modal.Header>
        <Modal.Body className="glass-form-card">
          <h6 className="mb-3">Employees</h6>
          <Form.Control
            type="text"
            placeholder="Search employee by name..."
            value={employeeSearch}
            onChange={e => setEmployeeSearch(e.target.value)}
            className="mb-3"
            autoFocus
          />
          {employeesLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-primary">Loading employees...</p>
            </div>
          ) : filteredEmployees.length > 0 ? (
            <>
              <Table className="department-details-table">
                <thead>
                  <tr>
                    <th style={{ width: "50px" }}>Picture</th>
                    <th style={{ width: "20%" }}>Name</th>
                    <th style={{ width: "30%" }}>Email</th>
                    <th style={{ width: "20%" }}>Phone</th>
                    <th style={{ width: "20%" }}>National ID</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id}>
                      <td>
                        {employee.profile_picture ? (
                          <Image
                            src={`http://127.0.0.1:8000/storage/${employee.profile_picture}`}
                            roundedCircle
                            width={35}
                            height={35}
                            alt={`${employee.first_name} ${employee.last_name}`}
                          />
                        ) : (
                          <FaUser className="text-accent" size={25} />
                        )}
                      </td>
                      <td className="text-ellipsis">{`${employee.first_name} ${employee.last_name}`}</td>
                      <td className="text-ellipsis">{employee.email}</td>
                      <td className="text-ellipsis">{employee.phone}</td>
                      <td className="text-ellipsis">{employee.national_id}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || actionLoading}
                  >
                    Previous
                  </Button>
                  <span>Page {currentPage} of {totalPages}</span>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || actionLoading}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="text-muted text-center">No employees found.</p>
          )}
          <div className="d-flex justify-content-end mt-4">
            <Button
              variant="secondary"
              onClick={handleCloseDetailsModal}
              className="department-btn-secondary px-4"
            >
              Close
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      <Modal
        show={showConfirmModal}
        onHide={handleCloseConfirm}
        centered
        className="department-modal-card"
      >
        <Modal.Header className="modal-header border-0">
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
            Are you sure you want to delete the department "{departmentToDelete?.dept_name}"?
          </p>
          <div className="d-flex justify-content-end gap-2">
            <Button
              variant="secondary"
              onClick={handleCloseConfirm}
              className="department-btn-secondary"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              className="department-btn-danger"
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
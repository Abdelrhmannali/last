import React, { useEffect, useState, useCallback } from "react";
import { Table, Button, Modal, Form, Spinner, Badge, Card, Pagination } from "react-bootstrap";
import { FaUserCircle, FaTimes, FaUser } from "react-icons/fa";
import api from "../../api";
import "./Payroll.css";
import * as XLSX from "xlsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function PayrollTable() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/payroll/all-employees-data");
      setEmployees(data?.data || []);
      toast.success("Employee data loaded!", { position: "top-right", autoClose: 3000 });
    } catch {
      toast.error("Failed to load employee data!", { position: "top-right", autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleShow = (employee) => {
    setSelectedEmployee(employee);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setSelectedEmployee(null);
  };

  const filteredEmployees = employees.filter((emp) =>
    emp.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalItems = filteredEmployees.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getImageUrl = (emp) => {
    if (emp.profile_picture) {
      return `http://127.0.0.1:8000/storage/${emp.profile_picture}`;
    }
    if (emp.profile_image_url) return emp.profile_image_url;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      emp.full_name || "Unknown"
    )}&background=random&rounded=true`;
  };

  const formatTime = (time) => {
    if (!time) return "N/A";
    return new Date(`1970-01-01T${time}Z`).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const exportToExcel = () => {
    try {
      const ws = XLSX.utils.json_to_sheet(
        employees.map((emp) => ({
          Name: emp.full_name,
          Department: emp.dep_name,
          Salary: emp.salary,
          "Work Hours": emp.working_hours_per_day,
          Month: emp.payroll?.month,
          "Month Days": emp.payroll?.month_days,
          Attendance: emp.payroll?.attended_days,
          Absence: emp.payroll?.absent_days,
          Bonus: emp.payroll?.total_bonus_amount,
          Deduction: emp.payroll?.total_deduction_amount,
          "Net Salary": emp.payroll?.net_salary,
        }))
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Payroll");
      XLSX.writeFile(wb, "PayrollData.xlsx");
      toast.success("Exported to Excel!", { position: "top-right", autoClose: 3000 });
    } catch {
      toast.error("Failed to export data!", { position: "top-right", autoClose: 3000 });
    }
  };

  return (
    <div className="d-flex flex-column vh-100">
      <ToastContainer />
      <main className="flex-grow-1 p-2 bg-light">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-2">
          <h2 className="fw-bold text-primary mb-2 mb-md-0">💼 Payroll Dashboard</h2>
          <Form.Control
            type="text"
            placeholder="🔎 Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <Button variant="primary" className="mb-3" onClick={exportToExcel}>
            📥 Export to Excel
          </Button>
        </div>

        {loading ? (
          <div className="text-center">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 text-primary">Loading data...</p>
          </div>
        ) : (
          <>
            <div className="table-responsive shadow-sm rounded">
              <Table bordered hover className="align-middle text-center bg-white table-nowrap">
                <thead className="table-primary">
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Salary</th>
                    <th>Work Hours</th>
                    <th>Month</th>
                    <th>Month Days</th>
                    <th>Attendance</th>
                    <th>Absence</th>
                    <th>Bonus</th>
                    <th>Deduction</th>
                    <th>Net Salary</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEmployees.map((emp) => (
                    <tr key={emp.id}>
                      <td className="d-flex align-items-center gap-2">
                        <img
                          src={getImageUrl(emp)}
                          width="50"
                          height="50"
                          className="rounded-circle me-2 employee-avatar"
                          alt={emp.full_name}
                        />
                        <span className="text-ellipsis">{emp.full_name || "Unknown"}</span>
                      </td>
                      <td className="text-ellipsis">{emp.dep_name ?? "-"}</td>
                      <td>
                        <Badge bg="primary">{emp.salary ?? "-"} EGP</Badge>
                      </td>
                      <td>{emp.working_hours_per_day ?? "-"}</td>
                      <td>{emp.payroll?.month ?? "-"}</td>
                      <td>{emp.payroll?.month_days ?? "-"}</td>
                      <td>{emp.payroll?.attended_days ?? "-"}</td>
                      <td>{emp.payroll?.absent_days ?? "-"}</td>
                      <td>{emp.payroll?.total_bonus_amount ?? "-"}</td>
                      <td>{emp.payroll?.total_deduction_amount ?? "-"}</td>
                      <td>
                        <Badge bg="success">{emp.payroll?.net_salary ?? "-"} EGP</Badge>
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="outline-primary"
                          className="shadow-sm rounded-pill"
                          onClick={() => handleShow(emp)}
                        >
                          <FaUser className="me-1" /> View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            {totalPages > 1 && (
              <Pagination className="justify-content-center mt-2">
                <Pagination.First
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                />
                <Pagination.Prev
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                />
                {Array.from({ length: totalPages }, (_, i) => (
                  <Pagination.Item
                    key={i + 1}
                    active={i + 1 === currentPage}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                />
                <Pagination.Last
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                />
              </Pagination>
            )}
          </>
        )}

        <Modal
          show={showModal}
          onHide={handleClose}
          centered
          className="fade-in compact-modal"
        >
          <Modal.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
            <Modal.Title className="fs-4 fw-bold d-flex align-items-center gap-2">
              <FaUserCircle className="text-white" /> Employee Profile
            </Modal.Title>
            <Button
              variant="link"
              onClick={handleClose}
              className="text-white fs-4 p-0"
            >
              <FaTimes />
            </Button>
          </Modal.Header>
          <Modal.Body>
            {selectedEmployee ? (
              <div className="container-fluid">
                <div className="text-center mb-0-5">
                  <img
                    src={getImageUrl(selectedEmployee)}
                    alt={selectedEmployee.full_name}
                    className="employee-profile-avatar"
                  />
                  <h3 className="mt-0-5 fw-bold text-primary fs-4">
                    {selectedEmployee.full_name || "Unknown"}
                  </h3>
                  <Badge bg="primary" className="fs-5">
                    {selectedEmployee.dep_name ?? "No Department"}
                  </Badge>
                </div>
                <div className="section-divider" />
                <h5 className="fw-bold text-primary mb-0-5 fs-5">Work Details</h5>
                <div className="row g-1 mb-0-5">
                  <div className="col-12 col-md-6 col-lg-4 slide-in">
                    <Card className="glass-card p-1">
                      <h6 className="mb-0 fw-bold">Salary</h6>
                      <p className="text-success mb-0">
                        {selectedEmployee.salary ?? "N/A"} EGP
                      </p>
                    </Card>
                  </div>
                  <div className="col-12 col-md-6 col-lg-4 slide-in">
                    <Card className="glass-card p-1">
                      <h6 className="mb-0 fw-bold">Work Hours</h6>
                      <p className="text-info mb-0">
                        {selectedEmployee.working_hours_per_day ?? "N/A"} hours/day
                      </p>
                    </Card>
                  </div>
                  <div className="col-12 col-md-6 col-lg-4 slide-in">
                    <Card className="glass-card p-1">
                      <h6 className="mb-0 fw-bold">Check-In Time</h6>
                      <p className="mb-0">
                        {formatTime(selectedEmployee.default_check_in_time)}
                      </p>
                    </Card>
                  </div>
                  <div className="col-12 col-md-6 col-lg-4 slide-in">
                    <Card className="glass-card p-1">
                      <h6 className="mb-0 fw-bold">Check-Out Time</h6>
                      <p className="mb-0">
                        {formatTime(selectedEmployee.default_check_out_time)}
                      </p>
                    </Card>
                  </div>
                </div>
                <div className="section-divider" />
                <h5 className="fw-bold text-primary mb-0-5 fs-5">Payroll Summary</h5>
                <div className="row g-1 mb-0-5">
                  <div className="col-12 col-md-6 col-lg-4 slide-in">
                    <Card className="glass-card p-1">
                      <h6 className="mb-0 fw-bold">Month Days</h6>
                      <p className="mb-0">
                        {selectedEmployee.payroll?.month_days ?? "N/A"}
                      </p>
                    </Card>
                  </div>
                  <div className="col-12 col-md-6 col-lg-4 slide-in">
                    <Card className="glass-card p-1">
                      <h6 className="mb-0 fw-bold">Attendance</h6>
                      <p className="mb-0">
                        {selectedEmployee.payroll?.attended_days ?? "N/A"}
                      </p>
                    </Card>
                  </div>
                  <div className="col-12 col-md-6 col-lg-4 slide-in">
                    <Card className="glass-card p-1">
                      <h6 className="mb-0 fw-bold">Absence</h6>
                      <p className="mb-0">
                        {selectedEmployee.payroll?.absent_days ?? "N/A"}
                      </p>
                    </Card>
                  </div>
                  <div className="col-12 col-md-6 col-lg-4 slide-in">
                    <Card className="glass-card p-1">
                      <h6 className="mb-0 fw-bold">Bonus</h6>
                      <p className="text-success mb-0">
                        {selectedEmployee.payroll?.total_bonus_amount ?? "N/A"} EGP
                      </p>
                    </Card>
                  </div>
                  <div className="col-12 col-md-6 col-lg-4 slide-in">
                    <Card className="glass-card p-1">
                      <h6 className="mb-0 fw-bold">Late Deduction</h6>
                      <p className="mb-0">
                        {selectedEmployee.payroll?.late_deduction_amount ?? "N/A"} EGP
                      </p>
                    </Card>
                  </div>
                  <div className="col-12 col-md-6 col-lg-4 slide-in">
                    <Card className="glass-card p-1">
                      <h6 className="mb-0 fw-bold">Absence Deduction</h6>
                      <p className="mb-0">
                        {selectedEmployee.payroll?.absence_deduction_amount ?? "N/A"} EGP
                      </p>
                    </Card>
                  </div>
                  <div className="col-12 col-md-6 col-lg-4 slide-in">
                    <Card className="glass-card p-1">
                      <h6 className="mb-0 fw-bold">Total Deduction</h6>
                      <p className="text-danger mb-0">
                        {selectedEmployee.payroll?.total_deduction_amount ?? "N/A"} EGP
                      </p>
                    </Card>
                  </div>
                  <div className="col-12 slide-in">
                    <Card className="glass-card p-1 bg-primary text-white">
                      <h6 className="mb-0 fw-bold">Net Salary</h6>
                      <h4 className="fw-bold mb-0 fs-3">
                        {selectedEmployee.payroll?.net_salary ?? "N/A"} EGP
                      </h4>
                    </Card>
                  </div>
                </div>
              </div>
            ) : (
              <p>Loading employee data...</p>
            )}
          </Modal.Body>
        </Modal>
      </main>
    </div>
  );
}
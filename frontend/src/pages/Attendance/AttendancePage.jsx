import { useState, useEffect } from "react";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { FaFilePdf, FaFileCsv, FaEdit, FaTrash } from "react-icons/fa";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import api from "../../api";
import "./AttendancePage.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const styles = `
  .form-card {
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
    border-radius: 15px;
    animation: fadeIn 0.5s ease-in-out;
  }
  .check-in-card {
    background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  }
  .check-out-card {
    background: linear-gradient(135deg, #fdecea, #f8d7da);
  }
  .form-control:focus {
    border-color: #1e88e5;
    box-shadow: 0 0 8px rgba(30, 136, 229, 0.4);
    transition: all 0.3s ease;
  }
  .check-out-form .form-control:focus {
    border-color: #1565c0;
    box-shadow: 0 0 8px rgba(21, 101, 192, 0.4);
  }
  .action-button {
    transition: all 0.3s ease;
    font-size: 1.2rem;
    padding: 12px 24px;
    border-radius: 10px;
  }
  .check-in-button {
    background: linear-gradient(135deg, #007bff, #0056b3);
    border: none;
  }
  .check-in-button:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
    background: linear-gradient(135deg, #0056b3, #003d80);
  }
  .check-in-button:active {
    transform: scale(0.95);
    box-shadow: 0 2px 4px rgba(0, 123, 255, 0.2);
  }
  .check-out-button {
    background: linear-gradient(135deg, #1e88e5, #1565c0);
    border: none;
    color: #fff;
  }
  .check-out-button:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(21, 101, 192, 0.3);
    background: linear-gradient(135deg, #1565c0, #0d47a1);
  }
  .check-out-button:active {
    transform: scale(0.95);
    box-shadow: 0 2px 4px rgba(21, 101, 192, 0.2);
  }
  .details-button {
    background: linear-gradient(135deg, #17a2b8, #117a8b);
    border: none;
    font-size: 1.2rem;
    padding: 12px 24px;
    border-radius: 10px;
    transition: all 0.3s ease;
  }
  .details-button:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(23, 162, 184, 0.3);
    background: linear-gradient(135deg, #117a8b, #0c5460);
  }
  .details-button:active {
    transform: scale(0.95);
    box-shadow: 0 2px 4px rgba(23, 162, 184, 0.2);
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  select, select option {
    color: #212529 !important;
    background: #fff !important;
  }
  .modern-table {
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    border-collapse: separate;
    border-spacing: 0;
  }
  .modern-table th {
    background: linear-gradient(135deg, #1e88e5, #1565c0);
    color: #fff;
    font-weight: 600;
    padding: 15px;
    text-align: left;
    border-bottom: 2px solid #dee2e6;
  }
  .modern-table td {
    padding: 12px;
    vertical-align: middle;
    border-bottom: 1px solid #e9ecef;
    transition: background 0.3s ease;
  }
  .modern-table tr:hover {
    background: #f1f8ff;
    cursor: pointer;
  }
  .modern-table .table-success {
    background: rgba(40, 167, 69, 0.1);
  }
  .modern-table .table-danger {
    background: rgba(220, 53, 69, 0.1);
  }
  .modern-table .action-buttons button {
    margin-right: 8px;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 0.9rem;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    transition: all 0.3s ease;
  }
  .modern-table .action-buttons .edit-button {
    background: linear-gradient(135deg, #ffc107, #e0a800);
    border: none;
  }
  .modern-table .action-buttons .edit-button:hover {
    background: linear-gradient(135deg, #e0a800, #c79100);
    transform: scale(1.05);
  }
  .modern-table .action-buttons .delete-button {
    background: linear-gradient(135deg, #dc3545, #c82333);
    border: none;
  }
  .modern-table .action-buttons .delete-button:hover {
    background: linear-gradient(135deg, #c82333, #b21f2d);
    transform: scale(1.05);
  }
  .modern-table .employee-link {
    color: #1e88e5;
    text-decoration: none;
    font-weight: 500;
  }
  .modern-table .employee-link:hover {
    color: #1565c0;
    text-decoration: underline;
  }
`;

export default function AttendancePage() {
  const [attendances, setAttendances] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({
    employee_name: "",
    department_name: "",
    date: "",
  });
  const [checkInFormData, setCheckInFormData] = useState({
    employee_id: "",
    date: "",
    checkInTime: "",
  });
  const [checkOutFormData, setCheckOutFormData] = useState({
    employee_id: "",
    date: "",
    checkOutTime: "",
  });
  const [editFormData, setEditFormData] = useState({
    employee_id: "",
    date: "",
    checkInTime: "",
    checkOutTime: "",
  });

  useEffect(() => {
    fetchAttendances();
    fetchEmployees();
  }, [currentPage, filters]);

  useEffect(() => {
    if (checkOutFormData.date) {
      fetchAttendances();
    }
  }, [checkOutFormData.date]);

  useEffect(() => {
    console.log("Attendances:", attendances);
    console.log("CheckOut Date:", checkOutFormData.date);
    console.log(
      "Filtered Check-Out Employees:",
      attendances.filter((a) => {
        const attendanceDate = new Date(a.date).toISOString().split("T")[0];
        return attendanceDate === checkOutFormData.date && a.checkInTime && !a.checkOutTime;
      })
    );
  }, [attendances, checkOutFormData.date]);

  const fetchAttendances = async () => {
    try {
      const response = await api.get("/attendances", {
        params: {
          page: currentPage,
          employee_name: filters.employee_name,
          department_name: filters.department_name,
          date: filters.date || checkOutFormData.date,
        },
      });
      setAttendances(response.data.data);
      setCurrentPage(response.data.current_page);
      setLastPage(response.data.last_page);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to fetch attendances");
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get("/employees");
      setEmployees(Array.isArray(response.data.data) ? response.data.data : response.data);
    } catch (error) {
      toast.error("Failed to fetch employees");
    }
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    console.log("CheckIn Data:", checkInFormData);
    try {
      const response = await api.post("/attendances/check-in", checkInFormData);
      console.log("CheckIn Response:", response);

      const employeeObj = employees.find(emp => emp.id === Number(checkInFormData.employee_id));
      const attendanceWithEmployee = {
        ...response.data.attendance,
        employee: {
          id: employeeObj.id,
          full_name: employeeObj.full_name,
          first_name: employeeObj.first_name,
          last_name: employeeObj.last_name,
          dept_name: employeeObj.dept_name,
          profile_picture_url: employeeObj.profile_image_url,
          email: employeeObj.email,
        }
      };

      setAttendances(prevAttendances => {
        const exists = prevAttendances.some(
          a => a.employee.id === attendanceWithEmployee.employee.id && a.date === attendanceWithEmployee.date
        );
        if (exists) {
          return prevAttendances.map(a =>
            a.employee.id === attendanceWithEmployee.employee.id && a.date === attendanceWithEmployee.date
              ? attendanceWithEmployee
              : a
          );
        }
        return [...prevAttendances, attendanceWithEmployee];
      });

      await fetchAttendances();
      setCheckInFormData({ employee_id: "", date: "", checkInTime: "" });
      toast.success("Check-in recorded successfully");
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.error || "Failed to record check-in");
    }
  };

  const handleCheckOut = async (e) => {
    e.preventDefault();
    console.log("CheckOut Data:", checkOutFormData);
    try {
      const response = await api.post("/attendances/check-out", checkOutFormData);
      console.log("CheckOut Response:", response);

      const employeeObj = employees.find(emp => emp.id === Number(checkOutFormData.employee_id));
      const attendanceWithEmployee = {
        ...response.data.attendance,
        employee: {
          id: employeeObj.id,
          full_name: employeeObj.full_name,
          first_name: employeeObj.first_name,
          last_name: employeeObj.last_name,
          dept_name: employeeObj.dept_name,
          profile_picture_url: employeeObj.profile_image_url,
          email: employeeObj.email,
        }
      };

      setAttendances(prevAttendances =>
        prevAttendances.map(a =>
          a.employee.id === attendanceWithEmployee.employee.id && a.date === attendanceWithEmployee.date
            ? attendanceWithEmployee
            : a
        )
      );

      await fetchAttendances();
      setCheckOutFormData({ employee_id: "", date: "", checkOutTime: "" });
      toast.success("Check-out recorded successfully");
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.error || "Failed to record check-out");
    }
  };

  const handleEditClick = (attendance) => {
    setSelectedAttendance(attendance);
    setEditFormData({
      employee_id: attendance.employee.id,
      date: attendance.date,
      checkInTime: attendance.checkInTime,
      checkOutTime: attendance.checkOutTime,
    });
    setShowEditModal(true);
  };

  const handleUpdateAttendance = async () => {
    try {
      const response = await api.put(`/attendances/${selectedAttendance.employee.id}`, editFormData);
      setAttendances(prevAttendances =>
        prevAttendances.map(a =>
          a.id === selectedAttendance.id ? response.data.attendance : a
        )
      );
      setShowEditModal(false);
      setEditFormData({ employee_id: "", date: "", checkInTime: "", checkOutTime: "" });
      toast.success("Attendance updated successfully");
      await fetchAttendances();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update attendance");
    }
  };

  const handleDelete = async (attendance) => {
    if (window.confirm("Are you sure you want to delete this attendance record?")) {
      try {
        await api.delete(`/attendances/${attendance.employee.id}`, {
          data: { date: attendance.date },
        });
        setAttendances(prevAttendances => prevAttendances.filter(a => a.id !== attendance.id));
        toast.success("Attendance deleted successfully");
        await fetchAttendances();
      } catch (error) {
        toast.error(error.response?.data?.error || "Failed to delete attendance");
      }
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Attendance Report", 14, 10);
    doc.autoTable({
      head: [["Date", "Employee", "Department", "Check-In", "Check-Out", "Late(h)", "Overtime(h)", "Status"]],
      body: attendances.map((a) => [
        a.date,
        a.employee.full_name,
        a.employee.dept_name,
        a.checkInTime,
        a.checkOutTime,
        a.lateDurationInHours,
        a.overtimeDurationInHours,
        a.status,
      ]),
      foot: [["", "", "", "", "Totals:", totalLateHours.toFixed(2), totalOvertimeHours.toFixed(2), ""]],
    });
    doc.save("attendance.pdf");
    toast.success("PDF exported successfully");
  };

  const exportSinglePDF = (employeeName, rows) => {
    const doc = new jsPDF();
    doc.text(`Attendance Report for ${employeeName}`, 14, 10);
    doc.autoTable({
      head: [["Date", "Check-In", "Check-Out", "Late(h)", "Overtime(h)", "Status"]],
      body: rows.map((a) => [
        a.date,
        a.checkInTime,
        a.checkOutTime,
        a.lateDurationInHours,
        a.overtimeDurationInHours,
        a.status,
      ]),
    });
    doc.save(`${employeeName.replace(/\s+/g, '_')}_attendance.pdf`);
  };

  const totalLateHours = attendances.reduce((sum, a) => sum + a.lateDurationInHours, 0);
  const totalOvertimeHours = attendances.reduce((sum, a) => sum + a.overtimeDurationInHours, 0);
  const absenceMap = {};
  const presentCount = attendances.filter((a) => a.status === "Present").length;
  const absentCount = attendances.filter((a) => a.status === "Absent").length;
  attendances.forEach((a) => {
    if (a.status === "Absent") {
      const key = a.employee.full_name;
      absenceMap[key] = (absenceMap[key] || 0) + 1;
    }
  });
  const absenceData = Object.entries(absenceMap).map(([name, count]) => ({ name, absences: count }));
  const pieData = [
    { name: "Present", value: presentCount },
    { name: "Absent", value: absentCount },
  ];
  const COLORS = ["#00C49F", "#FF8042"];

  return (
    <div className="p-3 attendance-page glass-card">
      <style>{styles}</style>
      <ToastContainer position="bottom-end" className="p-3" autoClose={3000} />
      <div className="d-flex justify-content-between mb-4">
        <h3 className="text-primary">Attendance Records</h3>
        <div className="d-flex gap-2">
          <CSVLink
            className="btn btn-outline-secondary d-flex align-items-center gap-1"
            filename="attendance.csv"
            data={attendances.map((a) => ({
              date: a.date,
              employee: a.employee.full_name,
              department: a.employee.dept_name,
              checkInTime: a.checkInTime,
              checkOutTime: a.checkOutTime,
              lateDurationInHours: a.lateDurationInHours,
              overtimeDurationInHours: a.overtimeDurationInHours,
              status: a.status,
            }))}
            onClick={() => {
              toast.success("CSV exported successfully");
            }}
          >
            <FaFileCsv /> CSV
          </CSVLink>
          <Button
            variant="outline-primary"
            className="d-flex align-items-center gap-1"
            onClick={exportPDF}
          >
            <FaFilePdf /> PDF
          </Button>
        </div>
      </div>

      <div className="d-flex justify-content-center gap-4 mb-4">
        <div className="card p-4 form-card check-in-card" style={{ width: "500px" }}>
          <h4 className="text-center mb-4" style={{ fontSize: "1.8rem", color: "#0056b3" }}>Check-In</h4>
          <Form onSubmit={handleCheckIn}>
            <Form.Group className="mb-4">
              <Form.Label style={{ fontSize: "1.1rem" }}>Employee</Form.Label>
              <Form.Control
                as="select"
                value={checkInFormData.employee_id}
                onChange={(e) => setCheckInFormData({ ...checkInFormData, employee_id: e.target.value })}
                required
              >
                <option value="">Select Employee</option>
                {Array.isArray(employees) && employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name && emp.last_name
                      ? `${emp.first_name} ${emp.last_name}`
                      : emp.full_name}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label style={{ fontSize: "1.1rem" }}>Date</Form.Label>
              <Form.Control
                type="date"
                value={checkInFormData.date}
                onChange={(e) => setCheckInFormData({ ...checkInFormData, date: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label style={{ fontSize: "1.1rem" }}>Check-In Time</Form.Label>
              <Form.Control
                type="time"
                value={checkInFormData.checkInTime}
                onChange={(e) => setCheckInFormData({ ...checkInFormData, checkInTime: e.target.value })}
                required
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100 action-button check-in-button">
              Record Check-In
            </Button>
          </Form>
        </div>

        <div className="card p-4 form-card check-out-card" style={{ width: "500px" }}>
          <h4 className="text-center mb-4" style={{ fontSize: "1.8rem", color: "#dc3545" }}>Check-Out</h4>
          <Form onSubmit={handleCheckOut} className="check-out-form">
            <Form.Group className="mb-4">
              <Form.Label style={{ fontSize: "1.1rem" }}>Date</Form.Label>
              <Form.Control
                type="date"
                value={checkOutFormData.date}
                onChange={(e) => setCheckOutFormData({ ...checkOutFormData, date: e.target.value, employee_id: "" })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label style={{ fontSize: "1.1rem" }}>Employee</Form.Label>
              <Form.Control
                as="select"
                value={checkOutFormData.employee_id}
                onChange={(e) => setCheckOutFormData({ ...checkOutFormData, employee_id: e.target.value })}
                required
                disabled={!checkOutFormData.date}
              >
                <option value="">Select Employee</option>
                {checkOutFormData.date &&
                  attendances
                    .filter((a) => {
                      const attendanceDate = new Date(a.date).toISOString().split("T")[0];
                      return (
                        attendanceDate === checkOutFormData.date &&
                        a.checkInTime &&
                        !a.checkOutTime
                      );
                    })
                    .map((a) => (
                      <option key={a.employee.id} value={a.employee.id}>
                        {a.employee.first_name && a.employee.last_name
                          ? `${a.employee.first_name} ${a.employee.last_name}`
                          : a.employee.full_name}
                      </option>
                    ))}
                {checkOutFormData.date &&
                  attendances.filter((a) => {
                    const attendanceDate = new Date(a.date).toISOString().split("T")[0];
                    return (
                      attendanceDate === checkOutFormData.date &&
                      a.checkInTime &&
                      !a.checkOutTime
                    );
                  }).length === 0 && (
                    <option disabled>لا يوجد موظفين متاحين للشيك أوت في هذا اليوم</option>
                  )}
              </Form.Control>
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label style={{ fontSize: "1.1rem" }}>Check-Out Time</Form.Label>
              <Form.Control
                type="time"
                value={checkOutFormData.checkOutTime}
                onChange={(e) => setCheckOutFormData({ ...checkOutFormData, checkOutTime: e.target.value })}
                required
              />
            </Form.Group>
            <div className="d-flex gap-2">
              <Button variant="primary" type="submit" className="w-100 action-button check-out-button">
                Record Check-Out
              </Button>
            </div>
          </Form>
        </div>
      </div>

      <div className="text-center mb-4">
        <Button
          className="details-button"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? "Hide Details" : "Show Details"}
        </Button>
      </div>

      {showDetails && (
        <div>
          <div className="mb-4">
            <Form>
              <div className="row">
                <Form.Group className="col-md-3">
                  <Form.Label>Employee Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={filters.employee_name}
                    onChange={(e) => setFilters({ ...filters, employee_name: e.target.value })}
                  />
                </Form.Group>
                <Form.Group className="col-md-3">
                  <Form.Label>Department</Form.Label>
                  <Form.Control
                    type="text"
                    value={filters.department_name}
                    onChange={(e) => setFilters({ ...filters, department_name: e.target.value })}
                  />
                </Form.Group>
                <Form.Group className="col-md-3">
                  <Form.Label>Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={filters.date}
                    onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                  />
                </Form.Group>
              </div>
            </Form>
          </div>

          <div className="row mb-4">
            <div className="col-md-6">
              <h5 className="text-secondary">Absence Summary</h5>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={absenceData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="absences" fill="#f44336" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="col-md-6">
              <h5 className="text-secondary">Present vs Absent</h5>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <Table className="modern-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Employee</th>
                <th>Department</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Late</th>
                <th>Overtime</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {attendances.map((a) => (
                <tr key={a.id} className={a.status === "Absent" ? "table-danger" : a.status === "Present" ? "table-success" : ""}>
                  <td>{a.date}</td>
                  <td>
                    <span
                      className="employee-link"
                      onClick={() => exportSinglePDF(a.employee.full_name, attendances.filter((x) => x.employee.full_name === a.employee.full_name))}
                    >
                      {a.employee.full_name}
                    </span>
                  </td>
                  <td>{a.employee.dept_name}</td>
                  <td>{a.checkInTime}</td>
                  <td>{a.checkOutTime}</td>
                  <td>{a.lateDurationInHours}h</td>
                  <td>{a.overtimeDurationInHours}h</td>
                  <td>{a.status}</td>
                  <td className="action-buttons">
                    <Button
                      variant="warning"
                      className="edit-button"
                      onClick={() => handleEditClick(a)}
                    >
                      <FaEdit /> Edit
                    </Button>
                    <Button
                      variant="danger"
                      className="delete-button"
                      onClick={() => handleDelete(a)}
                    >
                      <FaTrash /> Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <div className="d-flex justify-content-between mt-3">
            <Button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </Button>
            <span>Page {currentPage} of {lastPage}</span>
            <Button
              disabled={currentPage === lastPage}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Attendance Record</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Employee</Form.Label>
              <Form.Control
                as="select"
                value={editFormData.employee_id}
                disabled
              >
                <option value={editFormData.employee_id}>
                  {selectedAttendance?.employee.full_name}
                </option>
              </Form.Control>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={editFormData.date}
                onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Check-In Time</Form.Label>
              <Form.Control
                type="time"
                value={editFormData.checkInTime}
                onChange={(e) => setEditFormData({ ...editFormData, checkInTime: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Check-Out Time</Form.Label>
              <Form.Control
                type="time"
                value={editFormData.checkOutTime}
                onChange={(e) => setEditFormData({ ...editFormData, checkOutTime: e.target.value })}
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleUpdateAttendance}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
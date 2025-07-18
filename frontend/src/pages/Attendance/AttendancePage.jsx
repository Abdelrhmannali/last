
import { useState, useEffect } from "react";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { FaFilePdf, FaFileCsv, FaEdit, FaTrash, FaClock, FaEye } from "react-icons/fa";
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
  Cell,
  Legend,
} from "recharts";

export default function AttendancePage() {
  const [attendances, setAttendances] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({
    employee_name: "",
    department: "",
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
  const [loading, setLoading] = useState(false);

  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  };

  const handleSetCurrentCheckInDate = () => {
    setCheckInFormData({ ...checkInFormData, date: getCurrentDate() });
  };

  const handleSetCurrentCheckInTime = () => {
    setCheckInFormData({ ...checkInFormData, checkInTime: getCurrentTime() });
  };

  const handleSetCurrentCheckOutDate = () => {
    setCheckOutFormData({ ...checkOutFormData, date: getCurrentDate() });
  };

  const handleSetCurrentCheckOutTime = () => {
    setCheckOutFormData({ ...checkOutFormData, checkOutTime: getCurrentTime() });
  };

  useEffect(() => {
    fetchAttendances();
    fetchEmployees();
  }, [currentPage, filters]);

  useEffect(() => {
    if (checkOutFormData.date) {
      fetchAttendances();
    }
  }, [checkOutFormData.date]);

  const fetchAttendances = async () => {
    setLoading(true);
    try {
      const response = await api.get("/attendances", {
        params: {
          page: currentPage,
          employee_name: filters.employee_name,
          department: filters.department,
          date: filters.date || checkOutFormData.date,
        },
      });
      setAttendances(response.data.data);
      setCurrentPage(response.data.current_page);
      setLastPage(response.data.last_page);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to fetch attendances", {
        position: "top-right",
        autoClose: 1000,
        toastId: "fetch-attendances-error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get("/employees");
      const employeeData = Array.isArray(response.data.data) ? response.data.data : response.data;
      setEmployees(employeeData);
    } catch (error) {
      toast.error("Failed to fetch employees", {
        position: "top-right",
        autoClose: 1000,
        toastId: "fetch-employees-error",
      });
    }
  };

  const getFullName = (employee) => {
    if (!employee) return 'N/A';
    return employee.full_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'N/A';
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post("/attendances/check-in", checkInFormData);
      const employeeObj = employees.find(emp => emp.id === Number(checkInFormData.employee_id));
      if (!employeeObj) {
        throw new Error("Employee not found");
      }
      const attendanceWithEmployee = {
        ...response.data.attendance,
        employee: {
          id: employeeObj.id,
          full_name: employeeObj.full_name || `${employeeObj.first_name} ${employeeObj.last_name}`,
          first_name: employeeObj.first_name || '',
          last_name: employeeObj.last_name || '',
          dept_name: employeeObj.department?.dept_name || 'N/A',
          profile_picture_url: employeeObj.profile_picture || 'default.png',
          email: employeeObj.email || 'N/A',
          department: employeeObj.department || {},
        },
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
      toast.success("Check-in recorded successfully", {
        position: "top-right",
        autoClose: 1000,
        toastId: "check-in-success",
      });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to record check-in", {
        position: "top-right",
        autoClose: 1000,
        toastId: "check-in-error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post("/attendances/check-out", checkOutFormData);
      const employeeObj = employees.find(emp => emp.id === Number(checkOutFormData.employee_id));
      if (!employeeObj) {
        throw new Error("Employee not found");
      }
      const attendanceWithEmployee = {
        ...response.data.attendance,
        employee: {
          id: employeeObj.id,
          full_name: employeeObj.full_name || `${employeeObj.first_name} ${employeeObj.last_name}`,
          first_name: employeeObj.first_name || '',
          last_name: employeeObj.last_name || '',
          dept_name: employeeObj.department?.dept_name || 'N/A',
          profile_picture_url: employeeObj.profile_picture || 'default.png',
          email: employeeObj.email || 'N/A',
          department: employeeObj.department || {},
        },
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
      toast.success("Check-out recorded successfully", {
        position: "top-right",
        autoClose: 1000,
        toastId: "check-out-success",
      });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to record check-out", {
        position: "top-right",
        autoClose: 1000,
        toastId: "check-out-error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShow = (attendance) => {
    setSelectedAttendance(attendance);
    setShowDetailsModal(true);
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
    setLoading(true);
    try {
      const response = await api.put(`/attendances/${selectedAttendance.id}`, editFormData);

      setAttendances(prevAttendances =>
        prevAttendances.map(a =>
          a.id === selectedAttendance.id ? response.data.attendance : a
        )
      );
      setShowEditModal(false);
      setEditFormData({ employee_id: "", date: "", checkInTime: "", checkOutTime: "" });
      toast.success("Attendance updated successfully", {
        position: "top-right",
        autoClose: 1000,
        toastId: "update-attendance-success",
      });
      await fetchAttendances();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update attendance", {
        position: "top-right",
        autoClose: 1000,
        toastId: "update-attendance-error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (attendance) => {
    const employeeId = attendance.employee?.id;
    const dateOnly = attendance.date?.split("T")[0];

    if (!employeeId || !dateOnly) {
      toast.error("Missing employee ID or date for deletion", {
        position: "top-right",
        autoClose: 1000,
        toastId: "delete-attendance-error",
      });
      return;
    }

    if (window.confirm("Are you sure you want to delete this attendance record?")) {
      setLoading(true);
      try {
        await api.delete(`/attendances/${employeeId}?date=${dateOnly}`);

        setAttendances((prev) => prev.filter((a) => a.id !== attendance.id));
        toast.success("Attendance deleted successfully", {
          position: "top-right",
          autoClose: 1000,
          toastId: "delete-attendance-success",
        });
        await fetchEmployees();
        await fetchAttendances();
      } catch (error) {
        toast.error(error.response?.data?.error || "Failed to delete attendance", {
          position: "top-right",
          autoClose: 1000,
          toastId: "delete-attendance-error",
        });
      } finally {
        setLoading(false);
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
        getFullName(a.employee),
        a.employee?.department?.dept_name || 'N/A',
        a.checkInTime,
        a.checkOutTime,
        Number(a.lateDurationInHours).toFixed(2),
        Number(a.overtimeDurationInHours).toFixed(2),
        a.status,
      ]),
      foot: [["", "", "", "", "Totals:", Number(totalLateHours).toFixed(2), Number(totalOvertimeHours).toFixed(2), ""]],
    });
    doc.save("attendance.pdf");
    toast.success("PDF exported successfully", {
      position: "top-right",
      autoClose: 1000,
      toastId: "export-pdf-success",
    });
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
        Number(a.lateDurationInHours).toFixed(2),
        Number(a.overtimeDurationInHours).toFixed(2),
        a.status,
      ]),
    });
    doc.save(`${employeeName.replace(/\s+/g, '_')}_attendance.pdf`);
  };

  const totalLateHours = attendances.reduce((sum, a) => sum + Number(a.lateDurationInHours || 0), 0);
  const totalOvertimeHours = attendances.reduce((sum, a) => sum + Number(a.overtimeDurationInHours || 0), 0);
  const absenceMap = {};
  const presentCount = attendances.filter((a) => a.status === "Present").length;
  const absentCount = attendances.filter((a) => a.status === "Absent").length;
  attendances.forEach((a) => {
    if (a.status === "Absent") {
      const key = getFullName(a.employee);
      absenceMap[key] = (absenceMap[key] || 0) + 1;
    }
  });
  const absenceData = Object.entries(absenceMap).map(([name, count]) => ({ name, absences: count }));
  const pieData = [
    { name: "Present", value: presentCount },
    { name: "Absent", value: absentCount },
  ];
  const COLORS = ["#6b48a3", "#ff6b6b"];

  return (
    <div className="att-page-wrapper">
      <ToastContainer position="bottom-end" className="p-3" autoClose={3000} />
      {loading && <div className="att-loading-overlay"><div className="att-spinner"></div></div>}
   <header className="att-header">
  <div className="att-header-title">
    <FaClock className="att-header-icon" />
    <h3>Attendance Records</h3>
  </div>
  <div className="att-header-actions">
    <CSVLink
      className="att-action-button att-csv-button"
      filename="attendance.csv"
      data={attendances.map((a) => ({
        date: a.date,
        employee: getFullName(a.employee),
        department: a.employee?.department?.dept_name || 'N/A',
        checkInTime: a.checkInTime,
        checkOutTime: a.checkOutTime,
        lateDurationInHours: Number(a.lateDurationInHours).toFixed(2),
        overtimeDurationInHours: Number(a.overtimeDurationInHours).toFixed(2),
        status: a.status,
      }))}
      onClick={() =>
        toast.success("CSV exported successfully", {
          position: "top-right",
          autoClose: 1000,
          toastId: "export-csv-success",
        })
      }
    >
      <FaFileCsv /> CSV
    </CSVLink>

    <button className="att-action-button att-pdf-button" onClick={exportPDF}>
      <FaFilePdf /> PDF
    </button>

    <button
      className="att-action-button att-absent-button"
      onClick={async () => {
        try {
          await api.post("/run-mark-absentees");
          toast.success("تم تحديث الغياب بنجاح", {
            position: "top-right",
            autoClose: 1000,
            toastId: "absentees-marked",
          });
          await fetchAttendances();
        } catch (error) {
          toast.error("فشل في تحديث الغياب", {
            position: "top-right",
            autoClose: 1000,
            toastId: "absentees-error",
          });
        }
      }}
    >
      Mark Absentees
    </button>
  </div>
</header>


      <div className="att-forms-container">
        <div className="att-form-card att-check-in-card">
          <h4 className="att-form-title">Check-In</h4>
          <form onSubmit={handleCheckIn}>
            <div className="att-form-group">
              <label>Employee</label>
              <select
                value={checkInFormData.employee_id}
                onChange={(e) => setCheckInFormData({ ...checkInFormData, employee_id: e.target.value })}
                className="att-form-input"
                required
                disabled={loading}
              >
                <option value="">Select Employee</option>
                {Array.isArray(employees) && employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name && emp.last_name
                      ? `${emp.first_name} ${emp.last_name}`
                      : getFullName(emp)}
                  </option>
                ))}
              </select>
            </div>
            <div className="att-form-group">
              <label>Date</label>
              <div className="att-input-with-icon">
                <input
                  type="date"
                  value={checkInFormData.date}
                  onChange={(e) => setCheckInFormData({ ...checkInFormData, date: e.target.value })}
                  className="att-form-input"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="att-icon-button"
                  onClick={handleSetCurrentCheckInDate}
                  disabled={loading}
                  title="Set current date"
                >
                  <FaClock />
                </button>
              </div>
            </div>
            <div className="att-form-group">
              <label>Check-In Time</label>
              <div className="att-input-with-icon">
                <input
                  type="time"
                  value={checkInFormData.checkInTime}
                  onChange={(e) => setCheckInFormData({ ...checkInFormData, checkInTime: e.target.value })}
                  className="att-form-input"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="att-icon-button"
                  onClick={handleSetCurrentCheckInTime}
                  disabled={loading}
                  title="Set current time"
                >
                  <FaClock />
                </button>
              </div>
            </div>
            <button type="submit" className="att-form-button" disabled={loading}>
              Record Check-In
            </button>
          </form>
        </div>

        <div className="att-form-card att-check-out-card">
          <h4 className="att-form-title">Check-Out</h4>
          <form onSubmit={handleCheckOut}>
            <div className="att-form-group">
              <label>Date</label>
              <div className="att-input-with-icon">
                <input
                  type="date"
                  value={checkOutFormData.date}
                  onChange={(e) => setCheckOutFormData({ ...checkOutFormData, date: e.target.value, employee_id: "" })}
                  className="att-form-input"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="att-icon-button"
                  onClick={handleSetCurrentCheckOutDate}
                  disabled={loading}
                  title="Set current date"
                >
                  <FaClock />
                </button>
              </div>
            </div>
            <div className="att-form-group">
              <label>Employee</label>
              <select
                value={checkOutFormData.employee_id}
                onChange={(e) => setCheckOutFormData({ ...checkOutFormData, employee_id: e.target.value })}
                className="att-form-input"
                required
                disabled={!checkOutFormData.date || loading}
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
                        {getFullName(a.employee)}
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
                    <option disabled>No employees available for check-out</option>
                  )}
              </select>
            </div>
            <div className="att-form-group">
              <label>Check-Out Time</label>
              <div className="att-input-with-icon">
                <input
                  type="time"
                  value={checkOutFormData.checkOutTime}
                  onChange={(e) => setCheckOutFormData({ ...checkOutFormData, checkOutTime: e.target.value })}
                  className="att-form-input"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="att-icon-button"
                  onClick={handleSetCurrentCheckOutTime}
                  disabled={loading}
                  title="Set current time"
                >
                  <FaClock />
                </button>
              </div>
            </div>
            <button type="submit" className="att-form-button" disabled={loading}>
              Record Check-Out
            </button>
          </form>
        </div>
      </div>

      <div className="att-toggle-details">
        <button
          className="att-details-button"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? "Hide Details" : "Show Details"}
        </button>
      </div>

      {showDetails && (
        <div className="att-details-section">
          <div className="att-stats-container">
            <div className="att-stat-card">
              <p className="att-stat-label">Total Late Hours</p>
              <h3 className="att-stat-value">{Number(totalLateHours).toFixed(2)}h</h3>
            </div>
            <div className="att-stat-card">
              <p className="att-stat-label">Total Overtime Hours</p>
              <h3 className="att-stat-value">{Number(totalOvertimeHours).toFixed(2)}h</h3>
            </div>
            <div className="att-stat-card att-chart-card">
              <h5 className="att-section-title">Attendance Status</h5>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="att-filters-container">
            <div className="att-form-group">
              <label>Employee Name</label>
              <input
                type="text"
                value={filters.employee_name}
                onChange={(e) => setFilters({ ...filters, employee_name: e.target.value })}
                className="att-form-input"
                placeholder="Enter employee name"
              />
            </div>
            <div className="att-form-group">
              <label>Department</label>
              <input
                type="text"
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                className="att-form-input"
                placeholder="Enter department"
              />
            </div>
            <div className="att-form-group">
              <label>Date</label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                className="att-form-input"
              />
            </div>
          </div>

          <div className="att-table-container">
            <table className="att-modern-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Email</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Late</th>
                  <th>Overtime</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {attendances.map((a, idx) => (
                  <tr key={a.id} className={a.status === "Absent" ? "att-table-danger" : a.status === "Present" ? "att-table-success" : ""}>
                    <td>{idx + 1}</td>
                    <td>
                     
                      <span
                        className="att-employee-link"
                        onClick={() => exportSinglePDF(getFullName(a.employee), attendances.filter((x) => getFullName(x.employee) === getFullName(a.employee)))}
                      >
                        {getFullName(a.employee)}
                      </span>
                    </td>
                    <td>{a.employee?.department?.dept_name || 'N/A'}</td>
                    <td>{a.employee?.email || 'N/A'}</td>
                    <td>{a.checkInTime}</td>
                    <td>{a.checkOutTime}</td>
                    <td>{Number(a.lateDurationInHours).toFixed(2)}h</td>
                    <td>{Number(a.overtimeDurationInHours).toFixed(2)}h</td>
                    <td>{a.status}</td>
                    <td className="att-action-buttons">
                      <button
                        className="att-action-button att-view-button"
                        onClick={() => handleShow(a)}
                        title="View details"
                        disabled={loading}
                      >
                        <FaEye />
                      </button>
                      <button
                        className="att-action-button att-edit-button"
                        onClick={() => handleEditClick(a)}
                        title="Edit attendance"
                        disabled={loading}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="att-action-button att-delete-button"
                        onClick={() => handleDelete(a)}
                        title="Delete attendance"
                        disabled={loading}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="att-pagination">
            <button
              disabled={currentPage === 1 || loading}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="att-action-button"
            >
              Previous
            </button>
            <span className="att-page-info">Page {currentPage} of {lastPage}</span>
            <button
              disabled={currentPage === lastPage || loading}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="att-action-button"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <div className={`att-modal ${showEditModal ? "att-modal-show" : ""}`}>
        <div className="att-modal-content">
          <div className="att-modal-header">
            <h4>Edit Attendance Record</h4>
            <button className="att-modal-close" onClick={() => setShowEditModal(false)}>×</button>
          </div>
          <div className="att-modal-body">
            <div className="att-form-group">
              <label>Employee</label>
              <select
                value={editFormData.employee_id}
                className="att-form-input"
                disabled
              >
                <option value={editFormData.employee_id}>
                  {selectedAttendance?.employee.full_name}
                </option>
              </select>
            </div>
            <div className="att-form-group">
              <label>Date</label>
              <input
                type="date"
                value={editFormData.date}
                onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                className="att-form-input"
                required
                disabled={loading}
              />
            </div>
            <div className="att-form-group">
              <label>Check-In Time</label>
              <input
                type="time"
                value={editFormData.checkInTime}
                onChange={(e) => setEditFormData({ ...editFormData, checkInTime: e.target.value })}
                className="att-form-input"
                required
                disabled={loading}
              />
            </div>
            <div className="att-form-group">
              <label>Check-Out Time</label>
              <input
                type="time"
                value={editFormData.checkOutTime}
                onChange={(e) => setEditFormData({ ...editFormData, checkOutTime: e.target.value })}
                className="att-form-input"
                required
                disabled={loading}
              />
            </div>
          </div>
          <div className="att-modal-footer">
            <button className="att-action-button att-secondary" onClick={() => setShowEditModal(false)} disabled={loading}>
              Close
            </button>
            <button className="att-action-button" onClick={handleUpdateAttendance} disabled={loading}>
              Save
            </button>
          </div>
        </div>
      </div>

      <div className={`att-modal ${showDetailsModal ? "att-modal-show" : ""}`}>
        <div className="att-modal-content">
          <div className="att-modal-header">
            <h4>Attendance Details</h4>
            <button className="att-modal-close" onClick={() => setShowDetailsModal(false)}>×</button>
          </div>
          <div className="att-modal-body">
            {selectedAttendance && (
              <div className="att-details-content">
               
                <p><strong>Employee:</strong> {getFullName(selectedAttendance.employee)}</p>
                <p><strong>Email:</strong> {selectedAttendance.employee?.email || 'N/A'}</p>
                <p><strong>Department:</strong> {selectedAttendance.employee?.department?.dept_name || 'N/A'}</p>
                <p><strong>Date:</strong> {selectedAttendance.date}</p>
                <p><strong>Check-In:</strong> {selectedAttendance.checkInTime}</p>
                <p><strong>Check-Out:</strong> {selectedAttendance.checkOutTime}</p>
                <p><strong>Late:</strong> {Number(selectedAttendance.lateDurationInHours).toFixed(2)}h</p>
                <p><strong>Overtime:</strong> {Number(selectedAttendance.overtimeDurationInHours).toFixed(2)}h</p>
                <p><strong>Status:</strong> {selectedAttendance.status}</p>
              </div>
            )}
          </div>
          <div className="att-modal-footer">
            <button className="att-action-button att-secondary" onClick={() => setShowDetailsModal(false)} disabled={loading}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
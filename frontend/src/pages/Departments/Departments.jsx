import React, { useEffect, useState } from "react";
import { FaBuilding, FaEdit, FaTrash, FaPlus, FaUsers, FaCalculator, FaStar } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../../api";
import "./Department.css";
import { Table } from "react-bootstrap";


const Spinner = () => <div className="dept-spinner dept-small"></div>;

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDepartment, setEditDepartment] = useState(null);
  const [form, setForm] = useState({ dept_name: "" });
  const [formError, setFormError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);
  const [expandedDepartment, setExpandedDepartment] = useState(null);
  const [searchText, setSearchText] = useState("");

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/departments-with-employees");
      const departmentsData = data.data || [];
      setDepartments(departmentsData);
   
    } catch (err) {
      console.error("Error fetching departments:", err);
      toast.error("Failed to load departments!", {
        position: "top-right",
        autoClose: 1000,
        toastId: "fetch-error"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleShowModal = (department = null) => {
    setEditDepartment(department);
    setForm(department ? { dept_name: department.dept_name } : { dept_name: "" });
    setFormError("");
    setShowConfirmModal(false);
    setDepartmentToDelete(null);
    setExpandedDepartment(null);
  };

  const handleCloseModal = () => {
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
        toast.error("Department name is required!", {
          position: "top-right",
          autoClose: 1000,
          toastId: "form-error"
        });
        return;
      }
      if (editDepartment) {
        await api.put(`/departments/${editDepartment.id}`, form);
        toast.success("Department updated!", {
          position: "top-right",
          autoClose: 1000,
          toastId: "update-success"
        });
      } else {
        await api.post("/departments", form);
        toast.success("Department created!", {
          position: "top-right",
          autoClose: 1000,
          toastId: "create-success"
        });
      }
      fetchDepartments();
      handleCloseModal();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to save department!";
      setFormError(errorMsg);
      toast.error(errorMsg, {
        position: "top-right",
        autoClose: 1000,
        toastId: "save-error"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleShowConfirm = (department) => {
    setDepartmentToDelete(department);
    setShowConfirmModal(true);
    setExpandedDepartment(null);
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
      toast.success("Department deleted!", {
        position: "top-right",
        autoClose: 1000,
        toastId: "delete-success"
      });
      fetchDepartments();
      handleCloseConfirm();
    } catch {
      toast.error("Failed to delete department!", {
        position: "top-right",
        autoClose: 1000,
        toastId: "delete-error"
      });
      handleCloseConfirm();
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleDetails = (departmentId) => {
    setExpandedDepartment(expandedDepartment === departmentId ? null : departmentId);
  };

  const totalDepartments = departments.length;
  const totalEmployees = departments.reduce((sum, dept) => sum + (dept.employees?.length || 0), 0);
  const avgEmployeesPerDept = totalDepartments > 0 ? (totalEmployees / totalDepartments).toFixed(1) : 0;
  const largestDepartment = departments.reduce((max, dept) =>
    (dept.employees?.length || 0) > (max.employees?.length || 0) ? dept : max,
    { dept_name: "None", employees: [] }
  );

  const formatSalary = (salary) => {
    if (!salary) return "N/A";
    return `$${Number(salary).toLocaleString()}`;
  };

  const formatHireDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const selectedDepartment = departments.find(dept => dept.id === expandedDepartment);

  const filteredDepartments = departments.filter(dept =>
    dept.dept_name?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="dept-page-wrapper">
      <ToastContainer />
      <header className="dept-header">
        <div className="dept-header-title">
          <FaBuilding className="dept-header-icon" />
          <h2>Departments</h2>
        </div>
      </header>

      <div className="dept-stats-container">
        <div className="dept-stat-card">
          <FaBuilding className="dept-stat-icon" />
          <p>Total Departments</p>
          <h3>{totalDepartments}</h3>
        </div>
        <div className="dept-stat-card">
          <FaUsers className="dept-stat-icon" />
          <p>Total Employees</p>
          <h3>{totalEmployees}</h3>
        </div>
        <div className="dept-stat-card">
          <FaCalculator className="dept-stat-icon" />
          <p>Avg Employees/Dept</p>
          <h3>{parseFloat(avgEmployeesPerDept).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</h3>
        </div>
        <div className="dept-stat-card">
          <FaStar className="dept-stat-icon" />
          <p>Largest Department</p>
          <h3>{largestDepartment.dept_name}</h3>
          <p className="dept-stat-subtext">{largestDepartment.employees?.length || 0} employees</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="dept-form">
        <input
          type="text"
          name="dept_name"
          value={form.dept_name}
          onChange={handleChange}
          placeholder="Department name"
          className="dept-form-input"
          required
        />
        <button
          type="submit"
          className="dept-form-button"
          disabled={actionLoading}
        >
          {actionLoading ? <Spinner /> : <><FaPlus /> {editDepartment ? "Update" : "Add"} Department</>}
        </button>
      </form>

      {formError && <div className="dept-form-error">{formError}</div>}

      <form onSubmit={e => e.preventDefault()} style={{ margin: "1rem 0", display: "flex", gap: "1rem", alignItems: "center" }}>
        <input
          type="text"
          className="dept-form-input"
          placeholder="Search department by name..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ maxWidth: 300 }}
        />
        <button type="button" className="dept-form-button" onClick={() => setSearchText("")}>Reset</button>
      </form>

      {loading ? (
        <div className="dept-loading-container">
          <Spinner />
          <p>Loading departments...</p>
        </div>
      ) : filteredDepartments.length === 0 ? (
        <div className="dept-no-departments">
          <p>No departments found.</p>
        </div>
      ) : (
        <div className="dept-department-view">
          <div className="dept-department-grid">
            {filteredDepartments.map((department) => (
              <div key={department.id} className="dept-department-card">
                <div className="dept-department-content">
                  <h4>{department.dept_name}</h4>
                  <p>Employees: {department.employees?.length || 0}</p>
                  <div className="dept-department-actions">
                    <button
                      className="dept-action-button dept-edit"
                      onClick={() => handleShowModal(department)}
                      disabled={actionLoading}
                    >
                      {actionLoading && editDepartment?.id === department.id ? <Spinner /> : <><FaEdit /> Edit</>}
                    </button>
                    <button
                      className="dept-action-button dept-delete"
                      onClick={() => handleShowConfirm(department)}
                      disabled={actionLoading}
                    >
                      {actionLoading && departmentToDelete?.id === department.id ? <Spinner /> : <><FaTrash /> Delete</>}
                    </button>
                    <button
                      className="dept-action-button dept-details"
                      onClick={() => handleToggleDetails(department.id)}
                      disabled={actionLoading}
                    >
                      <FaUsers /> Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {expandedDepartment && selectedDepartment && (
        <div className="dept-employee-table-section">
          <h3 className="dept-employee-table-title">{selectedDepartment.dept_name} Employees</h3>
          {selectedDepartment.employees?.length > 0 ? (
  <div className="payroll-table-container mt-4">
  <Table responsive hover className="payroll-table align-middle">
    <thead>
      <tr>
        <th style={{ color: "#ac70c6", fontWeight: 600 }}>ID</th>
        <th style={{ color: "#ac70c6", fontWeight: 600 }}>First Name</th>
        <th style={{ color: "#ac70c6", fontWeight: 600 }}>Last Name</th>
        <th style={{ color: "#ac70c6", fontWeight: 600 }}>Email</th>
        <th style={{ color: "#ac70c6", fontWeight: 600 }}>Phone</th>
        <th style={{ color: "#ac70c6", fontWeight: 600 }}>National ID</th>
        <th style={{ color: "#ac70c6", fontWeight: 600 }}>Hire Date</th>
        <th style={{ color: "#ac70c6", fontWeight: 600 }}>Salary</th>
      </tr>
    </thead>
    <tbody>
      {selectedDepartment.employees.map((employee) => (
        <tr key={employee.id}>
          <td>{employee.id || "N/A"}</td>
          <td>{employee.first_name || "N/A"}</td>
          <td>{employee.last_name || "N/A"}</td>
          <td>{employee.email || "N/A"}</td>
          <td>{employee.phone || "N/A"}</td>
          <td>{employee.national_id || "N/A"}</td>
          <td>{formatHireDate(employee.hire_date)}</td>
          <td>
            <span className="payroll-badge payroll-salary">
              {formatSalary(employee.salary)}
            </span>
          </td>
        </tr>
      ))}
    </tbody>
  </Table>
</div>

          ) : (
            <p className="dept-no-employees">No employees in this department</p>
          )}x
        </div>
      )}

      {showConfirmModal && (
        <div className="dept-confirmation-overlay">
          <div className="dept-confirmation-card">
            <p>Are you sure you want to delete the department "{departmentToDelete?.dept_name}"?</p>
            <div className="dept-confirmation-actions">
              <button className="dept-action-button dept-secondary" onClick={handleCloseConfirm}>Cancel</button>
              <button
                className="dept-action-button dept-danger"
                onClick={handleDelete}
                disabled={actionLoading}
              >
                {actionLoading ? <Spinner /> : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
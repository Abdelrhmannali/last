import React, { useEffect, useState } from "react";
import { FaCog, FaChartPie, FaCalculator, FaTrash } from "react-icons/fa";
import api from "../../api";
import "./SettingsPage.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function SettingsPage() {
  const [settings, setSettings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    employee_id: "",
    deduction_type: "hours",
    deduction_value: "",
    overtime_type: "hours",
    overtime_value: "",
    weekend_days: [],
  });
  const [editSetting, setEditSetting] = useState(null);
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [settingToDelete, setSettingToDelete] = useState(null);

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const fetchEmployees = async () => {
    try {
      const { data } = await api.get("/employees");
      const employeeData = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
      setEmployees(employeeData);
    } catch (error) {
      console.error("Error fetching employees:", error.response?.data || error.message);
      toast.error("Failed to load employees!", { position: "top-right", autoClose: 3000 });
    }
  };

  const fetchSettings = async () => {
    try {
      const { data } = await api.get("/settings");
      const settingsData = Array.isArray(data.data) ? data.data : data.data ? [data.data] : [];
      setSettings(settingsData);
      toast.success("Settings loaded!", { position: "top-right", autoClose: 3000 });
    } catch (error) {
      console.error("Error fetching settings:", error.response?.data || error.message);
      toast.error("Failed to load settings!", { position: "top-right", autoClose: 3000 });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchEmployees();
      await fetchSettings();
      setLoading(false);
    };
    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleCheckboxChange = (day) => {
    setForm((prev) => {
      const weekend_days = prev.weekend_days.includes(day)
        ? prev.weekend_days.filter((d) => d !== day)
        : [...prev.weekend_days, day];
      if (weekend_days.length > 2) {
        toast.error("You can select only two weekend days!", { position: "top-right", autoClose: 3000 });
        return prev; // Prevent adding more than two days
      }
      return { ...prev, weekend_days };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setActionLoading(true);

    if (!form.employee_id || !form.deduction_value || !form.overtime_value) {
      setFormError("All fields are required.");
      toast.error("All fields are required!", { position: "top-right", autoClose: 3000 });
      setActionLoading(false);
      return;
    }

    if (form.weekend_days.length !== 2) {
      setFormError("You must select exactly two weekend days.");
      toast.error("You must select exactly two weekend days!", { position: "top-right", autoClose: 3000 });
      setActionLoading(false);
      return;
    }

    try {
      const payload = { ...form, employee_id: String(form.employee_id) };
      if (editSetting) {
        await api.put(`/settings/${editSetting.employee_id}`, payload);
        toast.success("Setting updated!", { position: "top-right", autoClose: 3000 });
        setEditSetting(null);
      } else {
        await api.post("/settings", payload);
        toast.success("Setting created!", { position: "top-right", autoClose: 3000 });
      }
      await fetchSettings();
      setForm({
        employee_id: "",
        deduction_type: "hours",
        deduction_value: "",
        overtime_type: "hours",
        overtime_value: "",
        weekend_days: [],
      });
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to save setting!";
      console.error("Error saving setting:", error.response?.data || error.message);
      setFormError(errorMsg);
      toast.error(errorMsg, { position: "top-right", autoClose: 3000 });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (setting) => {
    setEditSetting(setting);
    setForm({
      employee_id: String(setting.employee_id),
      deduction_type: setting.deduction_type,
      deduction_value: setting.deduction_value,
      overtime_type: setting.overtime_type,
      overtime_value: setting.overtime_value,
      weekend_days: JSON.parse(setting.weekend_days || "[]"),
    });
  };

  const handleShowConfirm = (setting) => {
    setSettingToDelete(setting);
    setEditSetting(null);
  };

  const handleCloseConfirm = () => {
    setSettingToDelete(null);
  };

  const handleDelete = async () => {
    if (!settingToDelete) return;
    setActionLoading(true);
    try {
      await api.delete(`/settings/${settingToDelete.employee_id}`);
      toast.success("Setting deleted!", { position: "top-right", autoClose: 3000 });
      await fetchSettings();
      handleCloseConfirm();
    } catch (error) {
      console.error("Error deleting setting:", error.response?.data || error.message);
      toast.error("Failed to delete setting!", { position: "top-right", autoClose: 3000 });
      handleCloseConfirm();
    } finally {
      setActionLoading(false);
    }
  };

  const totalSettings = settings.length;
  const deductionTypeData = settings.reduce(
    (acc, s) => {
      acc[s.deduction_type] = (acc[s.deduction_type] || 0) + 1;
      return acc;
    },
    { hours: 0, money: 0 }
  );
  const overtimeTypeData = settings.reduce(
    (acc, s) => {
      acc[s.overtime_type] = (acc[s.overtime_type] || 0) + 1;
      return acc;
    },
    { hours: 0, money: 0 }
  );
  const avgDeductionValue = settings.length > 0
    ? (settings.reduce((sum, s) => sum + parseFloat(s.deduction_value || 0), 0) / settings.length).toFixed(2)
    : 0;
  const avgOvertimeValue = settings.length > 0
    ? (settings.reduce((sum, s) => sum + parseFloat(s.overtime_value || 0), 0) / settings.length).toFixed(2)
    : 0;
  const weekendDaysData = daysOfWeek.map((day) => ({
    name: day,
    count: settings.filter((s) => JSON.parse(s.weekend_days || "[]").includes(day)).length,
  }));

  return (
    <div className="set-page-wrapper">
      <ToastContainer />
      <header className="set-header">
        <div className="set-header-title">
          <FaCog className="set-header-icon" />
          <h2>General Settings</h2>
        </div>
      </header>

      <div className="set-stats-container">
        <div className="set-stat-card">
          <FaChartPie className="set-stat-icon" />
          <p>Total Settings</p>
          <h3>{totalSettings}</h3>
        </div>
        <div className="set-stat-card">
          <FaCalculator className="set-stat-icon" />
          <p>Avg Deduction Value</p>
          <h3>{avgDeductionValue}</h3>
        </div>
        <div className="set-stat-card">
          <FaCalculator className="set-stat-icon" />
          <p>Avg Overtime Value</p>
          <h3>{avgOvertimeValue}</h3>
        </div>
        <div className="set-stat-card set-chart-card">
          <h3>Weekend Days Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weekendDaysData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip contentStyle={{ background: "rgba(255, 255, 255, 0.9)", border: "1px solid #ccc", borderRadius: "8px" }} />
              <Bar dataKey="count" fill="#6b48a3" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="set-form">
        <div className="set-form-section">
          <h3>{editSetting ? "Edit Setting" : "Add New Setting"}</h3>
          <div className="set-form-group">
            <label>Employee</label>
            <select
              name="employee_id"
              value={form.employee_id}
              onChange={handleChange}
              className="set-form-input"
              required
              disabled={actionLoading}
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={String(emp.id)}>
                  {emp.full_name || emp.name || "Unnamed Employee"}
                </option>
              ))}
            </select>
          </div>
          <div className="set-form-row">
            <div className="set-form-group">
              <label>Deduction Type</label>
              <select
                name="deduction_type"
                value={form.deduction_type}
                onChange={handleChange}
                className="set-form-input"
                required
                disabled={actionLoading}
              >
                <option value="hours">Hours</option>
                <option value="money">Money</option>
              </select>
            </div>
            <div className="set-form-group">
              <label>Deduction Value</label>
              <input
                type="number"
                name="deduction_value"
                value={form.deduction_value}
                onChange={handleChange}
                placeholder="Enter value"
                className="set-form-input"
                required
                disabled={actionLoading}
                step="0.01"
              />
            </div>
          </div>
          <div className="set-form-row">
            <div className="set-form-group">
              <label>Overtime Type</label>
              <select
                name="overtime_type"
                value={form.overtime_type}
                onChange={handleChange}
                className="set-form-input"
                required
                disabled={actionLoading}
              >
                <option value="hours">Hours</option>
                <option value="money">Money</option>
              </select>
            </div>
            <div className="set-form-group">
              <label>Overtime Value</label>
              <input
                type="number"
                name="overtime_value"
                value={form.overtime_value}
                onChange={handleChange}
                placeholder="Enter value"
                className="set-form-input"
                required
                disabled={actionLoading}
                step="0.01"
              />
            </div>
          </div>
          <div className="set-form-group">
            <label>Weekend Days (Select exactly 2 days)</label>
            <div className="set-checkbox-group">
              {daysOfWeek.map((day) => (
                <label key={day} className="set-checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.weekend_days.includes(day)}
                    onChange={() => handleCheckboxChange(day)}
                    disabled={actionLoading}
                  />
                  {day}
                </label>
              ))}
            </div>
          </div>
          <button type="submit" className="set-form-button" disabled={actionLoading}>
            {actionLoading ? <div className="set-spinner set-small"></div> : editSetting ? "Update Setting" : "Add Setting"}
          </button>
        </div>
      </form>

      {formError && <div className="set-form-error">{formError}</div>}

      {loading ? (
        <div className="set-loading-container">
          <div className="set-spinner"></div>
          <p>Loading settings...</p>
        </div>
      ) : settings.length === 0 ? (
        <div className="set-no-settings">
          <p>No settings found.</p>
        </div>
      ) : (
        <div className="set-settings-grid">
          {settings.map((setting) => (
            <div key={setting.employee_id} className="set-card">
              <div className="set-content">
                <h4>
                  {employees.find((e) => String(e.id) === String(setting.employee_id))?.full_name ||
                    employees.find((e) => String(e.id) === String(setting.employee_id))?.name ||
                    "Unknown Employee"}
                </h4>
                <p>Deduction: {setting.deduction_type} ({setting.deduction_value})</p>
                <p>Overtime: {setting.overtime_type} ({setting.overtime_value})</p>
                <p>Weekend Days: {JSON.parse(setting.weekend_days || "[]").join(", ") || "None"}</p>
                <div className="set-actions">
                  <button
                    className="set-action-button set-edit"
                    onClick={() => handleEdit(setting)}
                    disabled={actionLoading}
                  >
                    <FaCog /> Edit
                  </button>
                  <button
                    className="set-action-button set-delete"
                    onClick={() => handleShowConfirm(setting)}
                    disabled={actionLoading}
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {settingToDelete && (
        <div className="set-confirmation-overlay">
          <div className="set-confirmation-card">
            <p>
              Are you sure you want to delete the setting for{" "}
              {employees.find((e) => String(e.id) === String(settingToDelete.employee_id))?.full_name ||
                employees.find((e) => String(e.id) === String(settingToDelete.employee_id))?.name ||
                "this employee"}?
            </p>
            <div className="set-confirmation-actions">
              <button className="set-action-button set-secondary" onClick={handleCloseConfirm}>
                Cancel
              </button>
              <button className="set-action-button set-danger" onClick={handleDelete} disabled={actionLoading}>
                {actionLoading ? <div className="set-spinner set-small"></div> : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
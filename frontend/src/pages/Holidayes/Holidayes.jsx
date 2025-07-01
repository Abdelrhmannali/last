









// HolidaysPage.js
import React, { useEffect, useState } from "react";
import {
  FaCalendarPlus, FaEdit, FaTrash, FaCalendarAlt,
  FaChartPie, FaCalculator, FaStar
} from "react-icons/fa";
import api from "../../api";
import "./Holiday.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from "recharts";

const Spinner = () => <div className="hol-spinner hol-small"></div>;

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editHoliday, setEditHoliday] = useState(null);
  const [form, setForm] = useState({ name: "", date: "" });
  const [formError, setFormError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [holidayToDelete, setHolidayToDelete] = useState(null);
  const [filterDate, setFilterDate] = useState("");

  const formatDate = (dateStr) => {
    if (!dateStr) return "Not specified";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short", day: "numeric", month: "short", year: "numeric"
    });
  };

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/holidays");
      setHolidays(data?.data || []);
      toast.success("Holidays loaded!", {
        position: "top-right",
        autoClose: 1000,
        toastId: "holidays-loaded"
      });
    } catch (error) {
      console.error("Fetch holidays error:", error);
      toast.error("Failed to load holidays!", {
        position: "top-right",
        autoClose: 1000,
        toastId: "fetch-error"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setActionLoading(true);

    if (!form.name.trim() || !form.date) {
      setFormError("Holiday name and date are required.");
      toast.error("Holiday name and date are required!", {
        position: "top-right",
        autoClose: 1000,
        toastId: "form-error"
      });
      setActionLoading(false);
      return;
    }

    try {
      if (editHoliday) {
        await api.put(`/holidays/${editHoliday.id}`, form);
        toast.success("Holiday updated!", {
          position: "top-right",
          autoClose: 1000,
          toastId: "update-success"
        });
        setEditHoliday(null);
      } else {
        await api.post("/holidays", form);
        toast.success("Holiday created!", {
          position: "top-right",
          autoClose: 1000,
          toastId: "create-success"
        });
      }
      fetchHolidays();
      setForm({ name: "", date: "" });
    } catch {
      setFormError("Failed to save holiday!");
      toast.error("Failed to save holiday!", {
        position: "top-right",
        autoClose: 1000,
        toastId: "save-error"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleShowConfirm = (holiday) => {
    setHolidayToDelete(holiday);
    setForm({ name: holiday.name, date: holiday.date });
    setEditHoliday(null);
  };

  const handleCloseConfirm = () => {
    setHolidayToDelete(null);
    setForm({ name: "", date: "" });
  };

  const handleDelete = async () => {
    if (!holidayToDelete) return;
    setActionLoading(true);
    try {
      await api.delete(`/holidays/${holidayToDelete.id}`);
      toast.success("Holiday deleted!", {
        position: "top-right",
        autoClose: 1000,
        toastId: "delete-success"
      });
      fetchHolidays();
      handleCloseConfirm();
    } catch {
      toast.error("Failed to delete holiday!", {
        position: "top-right",
        autoClose: 1000,
        toastId: "delete-error"
      });
      handleCloseConfirm();
    } finally {
      setActionLoading(false);
    }
  };

  const filteredHolidays = filterDate
    ? holidays.filter(h => new Date(h.date).toISOString().split("T")[0] === filterDate)
    : holidays;

  const holidaysByMonth = holidays.reduce((acc, holiday) => {
    const month = new Date(holiday.date).toLocaleString("default", { month: "long", year: "numeric" });
    if (!acc[month]) acc[month] = [];
    acc[month].push(holiday);
    return acc;
  }, {});

  const totalHolidays = holidays.length;
  const holidaysPerMonth = Object.values(holidaysByMonth).map(h => h.length);
  const avgHolidaysPerMonth = holidaysPerMonth.length > 0
    ? (holidaysPerMonth.reduce((a, b) => a + b, 0) / holidaysPerMonth.length).toFixed(1)
    : 0;

  const pieData = Object.keys(holidaysByMonth).map(month => ({
    name: month,
    value: holidaysByMonth[month].length,
  }));

  const upcomingHoliday = holidays
    .filter(h => new Date(h.date) > new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  const COLORS = ['#6b48a3', '#8b5db4', '#ac70c6', '#c495d8', '#dab4e8'];

  const now = new Date();

    return (
    <div className="hol-page-wrapper">
      <ToastContainer />
      <header className="hol-header">
        <div className="hol-header-title">
          <FaCalendarAlt className="hol-header-icon" />
          <h2>Holidays</h2>
        </div>
      </header>

      {/* ضع الفلتر هنا مباشرة بعد الهيدر */}
  

      {/* الإحصائيات */}
      <div className="hol-stats-container">
        <div className="hol-stat-card">
          <FaChartPie className="hol-stat-icon" />
          <p>Total Holidays</p>
          <h3>{totalHolidays.toLocaleString()}</h3>
        </div>
        <div className="hol-stat-card">
          <FaCalculator className="hol-stat-icon" />
          <p>Average Holidays/Month</p>
          <h3>{parseFloat(avgHolidaysPerMonth).toLocaleString(undefined, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
          })}</h3>
        </div>
        <div className="hol-stat-card">
          <FaStar className="hol-stat-icon" />
          <p>Next Holiday</p>
          <h3>{upcomingHoliday ? upcomingHoliday.name : "None"}</h3>
          <p className="hol-stat-subtext">{upcomingHoliday ? formatDate(upcomingHoliday.date) : "N/A"}</p>
        </div>
        <div className="hol-stat-card hol-chart-card">
          <h3>Holidays by Month</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                outerRadius={80}
                fill="#6b48a3"
                dataKey="value"
                animationDuration={800}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  color: '#333'
                }}
              />
              <Legend wrapperStyle={{ color: '#333', fontSize: '0.8rem' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      

      <form onSubmit={handleSubmit} className="hol-form">
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Holiday name"
          className="hol-form-input"
          required
        />
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          className="hol-form-input"
          required
        />
        <button
          type="submit"
          className="hol-form-button"
          disabled={actionLoading}
        >
          <FaCalendarPlus /> {editHoliday ? "Update" : "Add"} Holiday
        </button>
      </form>
    <form
        onSubmit={e => e.preventDefault()}
        style={{ margin: "1rem 0", display: "flex", gap: "1rem", alignItems: "center" }}
      >
        <input
          type="date"
          className="hol-form-input"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          style={{ maxWidth: 220 }}
        />
        <button
          type="button"
          className="hol-form-button"
          onClick={() => setFilterDate("")}
        >
          Reset
        </button>
      </form>
      {formError && <div className="hol-form-error">{formError}</div>}

      {loading ? (
        <div className="hol-spinner-wrapper"><Spinner /></div>
      ) : filteredHolidays.length === 0 ? (
        <div className="hol-no-holidays">
          <p>No holidays found.</p>
        </div>
      ) : (
        <div className="hol-calendar-view">
          {Object.keys(
            filteredHolidays.reduce((acc, holiday) => {
              const month = new Date(holiday.date).toLocaleString("default", { month: "long", year: "numeric" });
              if (!acc[month]) acc[month] = [];
              acc[month].push(holiday);
              return acc;
            }, {})
          ).map((month) => (
            <div key={month} className="hol-month-section">
              <h3 className="hol-month-title">{month}</h3>
              <div className="hol-holiday-grid">
                {filteredHolidays
                  .filter(h => {
                    const m = new Date(h.date).toLocaleString("default", { month: "long", year: "numeric" });
                    return m === month;
                  })
                  .map((holiday) => {
                    const isCurrentMonth = new Date(holiday.date).getMonth() === now.getMonth() &&
                      new Date(holiday.date).getFullYear() === now.getFullYear();
                    return (
                      <div key={holiday.id} className={`hol-card ${isCurrentMonth ? 'hol-current-month' : ''}`}>
                        <div className="hol-content">
                          <h4>{holiday.name}</h4>
                          <p>{formatDate(holiday.date)}</p>
                          <div className="hol-actions">
                            <button
                              className="hol-action-button hol-edit"
                              onClick={() => {
                                setEditHoliday(holiday);
                                setForm({ name: holiday.name, date: holiday.date });
                              }}
                              disabled={actionLoading}
                            >
                              {actionLoading && editHoliday?.id === holiday.id ? <Spinner /> : <><FaEdit /> Edit</>}
                            </button>
                            <button
                              className="hol-action-button hol-delete"
                              onClick={() => handleShowConfirm(holiday)}
                              disabled={actionLoading}
                            >
                              {actionLoading && holidayToDelete?.id === holiday.id ? <Spinner /> : <><FaTrash /> Delete</>}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}

      {holidayToDelete && (
        <div className="hol-confirmation-overlay">
          <div className="hol-confirmation-card">
            <p>Are you sure you want to delete the holiday "{holidayToDelete.name}"?</p>
            <div className="hol-confirmation-actions">
              <button
                className="hol-action-button hol-secondary"
                onClick={handleCloseConfirm}
              >
                Cancel
              </button>
              <button
                className="hol-action-button hol-danger"
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
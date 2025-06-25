import React, { useEffect, useState } from 'react';
import api from '../../api';
import { toast } from 'react-toastify';
import './GeneralSetting.css';
import { FaCog } from 'react-icons/fa';

const GeneralSettingForm = () => {
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    employee_id: '',
    deduction_type: 'money',
    deduction_value: 0,
    overtime_type: 'money',
    overtime_value: 0,
    weekend_days: [],
  });
  const [loading, setLoading] = useState(false);
  const [weekendError, setWeekendError] = useState('');

  const allDays = ["Friday", "Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];

  useEffect(() => {
    api.get('/employees')
      .then(res => {
        setEmployees(res.data.data || []);
      })
      .catch(() => {
        toast.error('Failed to load employees.');
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleWeekendToggle = (day) => {
    let selected = [...formData.weekend_days];

    if (selected.includes(day)) {
      selected = selected.filter(d => d !== day);
    } else if (selected.length < 2) {
      selected.push(day);
    }

    if (selected.length > 2) {
      setWeekendError('You can only select 2 days.');
    } else {
      setWeekendError('');
    }

    setFormData({ ...formData, weekend_days: selected });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.weekend_days.length !== 2) {
      toast.error('Please select exactly two weekend days.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/settings', formData);
      toast.success('Settings saved successfully!');
      setFormData({
        employee_id: '',
        deduction_type: 'money',
        deduction_value: 0,
        overtime_type: 'money',
        overtime_value: 0,
        weekend_days: [],
      });
      setWeekendError('');
    } catch {
      toast.error('Failed to save settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="general-settings-wrapper">
      <div className="general-settings-card glass-bg p-4 shadow">
        <h2 className="text-primary fw-bold mb-4 d-flex align-items-center gap-2">
          <FaCog /> General Settings
        </h2>
        <form onSubmit={handleSubmit} className="row g-4">
          <div className="col-12">
            <label className="form-label">Employee</label>
            <select
              className="form-select"
              name="employee_id"
              value={formData.employee_id}
              onChange={handleChange}
              required
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label">Deduction Type</label>
            <select
              className="form-select"
              name="deduction_type"
              value={formData.deduction_type}
              onChange={handleChange}
              required
            >
              <option value="money">Money</option>
              <option value="hours">Hours</option>
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label">Deduction Value</label>
            <input
              type="number"
              name="deduction_value"
              className="form-control"
              value={formData.deduction_value}
              onChange={handleChange}
              required
              min="0"
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Overtime Type</label>
            <select
              className="form-select"
              name="overtime_type"
              value={formData.overtime_type}
              onChange={handleChange}
              required
            >
              <option value="money">Money</option>
              <option value="hours">Hours</option>
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label">Overtime Value</label>
            <input
              type="number"
              name="overtime_value"
              className="form-control"
              value={formData.overtime_value}
              onChange={handleChange}
              required
              min="0"
            />
          </div>

          <div className="col-12">
            <label className="form-label">Weekend Days (Select 2)</label>
            <div className="d-flex flex-wrap gap-2">
              {allDays.map(day => (
                <label
                  key={day}
                  className={`form-check-label px-3 py-2 border rounded-pill ${formData.weekend_days.includes(day) ? 'bg-primary text-white' : 'bg-light'}`}
                >
                  <input
                    type="checkbox"
                    className="form-check-input me-2"
                    checked={formData.weekend_days.includes(day)}
                    onChange={() => handleWeekendToggle(day)}
                  />
                  {day}
                </label>
              ))}
            </div>
            {weekendError && <div className="text-danger mt-2 small">{weekendError}</div>}
          </div>

          <div className="col-12">
            <button
              type="submit"
              className="btn btn-primary w-100 rounded-pill py-2 fw-bold"
              disabled={loading || formData.weekend_days.length !== 2}
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GeneralSettingForm;
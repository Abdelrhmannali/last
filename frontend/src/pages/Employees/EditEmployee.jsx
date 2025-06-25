import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import "./Employee.css";

export default function EditEmployee() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    salary: "",
    gender: "",
    nationality: "",
    national_id: "",
    birthdate: "",
    hire_date: "",
    default_check_in_time: "",
    default_check_out_time: "",
    department_id: "",
    working_hours_per_day: "",

    profile_picture: null,
  });

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Fetch employee and department data on component mount
  useEffect(() => {
    Promise.all([
      api.get(`/employees/${id}`),
      api.get("/departments"),
    ])
      .then(([employeeRes, deptRes]) => {
        const emp = employeeRes.data;
        setForm({
          first_name: emp.first_name,
          last_name: emp.last_name,
          email: emp.email,
          phone: emp.phone,
          address: emp.address || "",
          salary: emp.salary,
          gender: emp.gender || "",
          nationality: emp.nationality || "",
          national_id: emp.national_id || "",
          birthdate: emp.birthdate || "",
          hire_date: emp.hire_date || "",
          default_check_in_time: emp.default_check_in_time ? emp.default_check_in_time.slice(0, 5) : "",
          default_check_out_time: emp.default_check_out_time ? emp.default_check_out_time.slice(0, 5) : "",
          department_id: emp.department_id || "",
          working_hours_per_day: emp.working_hours_per_day || "",
       
          profile_picture: null,
        });
        setDepartments(deptRes.data);
      })
      .catch(() => setError("Failed to load employee data"))
      .finally(() => setLoading(false));
  }, [id]);

  // Handle input changes for form fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      if (
        (key === "default_check_in_time" || key === "default_check_out_time") &&
        (!value || value === "")
      ) {
        return; // Skip empty check-in/check-out times
      }

      if (value === "" || value === null || value === undefined) return;

      if (key === "profile_picture" && value instanceof File) {
        formData.append("profile_picture", value);
      } else if (Array.isArray(value)) {
        value.forEach((v) => formData.append(`${key}[]`, v));
      } else {
        formData.append(key, value);
      }
    });

    formData.append("_method", "PUT");

    api
      .post(`/employees/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then(() => {
        alert("Employee updated successfully");
        navigate("/employees");
      })
      .catch((err) => {
        if (err.response?.status === 422 && err.response.data.errors) {
          setFieldErrors(err.response.data.errors);
        } else {
          setError("Failed to update employee");
        }
      });
  };

  const days = ["Friday", "Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="add-employee-container">
      <h2 className="mb-4 text-primary">
        <i className="fa-solid fa-user-pen me-2"></i> Edit Employee
      </h2>
      <form onSubmit={handleSubmit} className="row g-3">
        {/* First Name */}
        <div className="col-md-6">
          <label className="form-label">First Name</label>
          <input
            className="form-control"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            required
          />
          {fieldErrors.first_name && (
            <div className="alert alert-danger p-1 mt-1">{fieldErrors.first_name[0]}</div>
          )}
        </div>
        {/* Last Name */}
        <div className="col-md-6">
          <label className="form-label">Last Name</label>
          <input
            className="form-control"
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            required
          />
          {fieldErrors.last_name && (
            <div className="alert alert-danger p-1 mt-1">{fieldErrors.last_name[0]}</div>
          )}
        </div>
        {/* Email */}
        <div className="col-md-6">
          <label className="form-label">Email</label>
          <input
            className="form-control"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
          {fieldErrors.email && (
            <div className="alert alert-danger p-1 mt-1">{fieldErrors.email[0]}</div>
          )}
        </div>
        {/* Phone */}
        <div className="col-md-6">
          <label className="form-label">Phone</label>
          <input
            className="form-control"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            required
          />
          {fieldErrors.phone && (
            <div className="alert alert-danger p-1 mt-1">{fieldErrors.phone[0]}</div>
          )}
        </div>
        {/* Address */}
        <div className="col-md-6">
          <label className="form-label">Address</label>
          <input
            className="form-control"
            name="address"
            value={form.address}
            onChange={handleChange}
          />
          {fieldErrors.address && (
            <div className="alert alert-danger p-1 mt-1">{fieldErrors.address[0]}</div>
          )}
        </div>
        {/* Salary */}
        <div className="col-md-6">
          <label className="form-label">Salary</label>
          <input
            className="form-control"
            name="salary"
            type="number"
            value={form.salary}
            onChange={handleChange}
            required
          />
          {fieldErrors.salary && (
            <div className="alert alert-danger p-1 mt-1">{fieldErrors.salary[0]}</div>
          )}
        </div>
        {/* Gender */}
        <div className="col-md-6">
          <label className="form-label">Gender</label>
          <select
            className="form-select"
            name="gender"
            value={form.gender}
            onChange={handleChange}
            required
          >
            <option value="">Choose...</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          {fieldErrors.gender && (
            <div className="alert alert-danger p-1 mt-1">{fieldErrors.gender[0]}</div>
          )}
        </div>
        {/* Nationality */}
        <div className="col-md-6">
          <label className="form-label">Nationality</label>
          <input
            className="form-control"
            name="nationality"
            value={form.nationality}
            onChange={handleChange}
            required
          />
          {fieldErrors.nationality && (
            <div className="alert alert-danger p-1 mt-1">{fieldErrors.nationality[0]}</div>
          )}
        </div>
        {/* National ID */}
        <div className="col-md-6">
          <label className="form-label">National ID</label>
          <input
            className="form-control"
            name="national_id"
            value={form.national_id}
            onChange={handleChange}
            required
          />
          {fieldErrors.national_id && (
            <div className="alert alert-danger p-1 mt-1">{fieldErrors.national_id[0]}</div>
          )}
        </div>
        {/* Birthdate */}
        <div className="col-md-6">
          <label className="form-label">Birthdate</label>
          <input
            className="form-control"
            name="birthdate"
            type="date"
            value={form.birthdate}
            onChange={handleChange}
            required
          />
          {fieldErrors.birthdate && (
            <div className="alert alert-danger p-1 mt-1">{fieldErrors.birthdate[0]}</div>
          )}
        </div>
        {/* Hire Date */}
        <div className="col-md-6">
          <label className="form-label">Hire Date</label>
          <input
            className="form-control"
            name="hire_date"
            type="date"
            value={form.hire_date}
            onChange={handleChange}
            required
          />
          {fieldErrors.hire_date && (
            <div className="alert alert-danger p-1 mt-1">{fieldErrors.hire_date[0]}</div>
          )}
        </div>
        {/* Check-in Time */}
        <div className="col-md-6">
          <label className="form-label">Check-in Time</label>
          <input
            className="form-control"
            name="default_check_in_time"
            type="time"
            value={form.default_check_in_time}
            onChange={handleChange}
          />
          {fieldErrors.default_check_in_time && (
            <div className="alert alert-danger p-1 mt-1">{fieldErrors.default_check_in_time[0]}</div>
          )}
        </div>
        {/* Check-out Time */}
        <div className="col-md-6">
          <label className="form-label">Check-out Time</label>
          <input
            className="form-control"
            name="default_check_out_time"
            type="time"
            value={form.default_check_out_time}
            onChange={handleChange}
          />
          {fieldErrors.default_check_out_time && (
            <div className="alert alert-danger p-1 mt-1">{fieldErrors.default_check_out_time[0]}</div>
          )}
        </div>
        {/* Department */}
        <div className="col-md-6">
          <label className="form-label">Department</label>
          <select
            className="form-select"
            name="department_id"
            value={form.department_id}
            onChange={handleChange}
          >
            <option value="">Choose...</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>{dept.dept_name}</option>
            ))}
          </select>
          {fieldErrors.department_id && (
            <div className="alert alert-danger p-1 mt-1">{fieldErrors.department_id[0]}</div>
          )}
        </div>
        {/* Working Hours per Day */}
        <div className="col-md-6">
          <label className="form-label">Working Hours per Day</label>
          <input
            className="form-control"
            name="working_hours_per_day"
            type="number"
            value={form.working_hours_per_day}
            onChange={handleChange}
          />
          {fieldErrors.working_hours_per_day && (
            <div className="alert alert-danger p-1 mt-1">{fieldErrors.working_hours_per_day[0]}</div>
          )}
        </div>
        {/* Profile Picture Upload */}
        <div className="col-md-6">
          <label className="form-label">Profile Picture</label>
          <input
            type="file"
            className="form-control"
            accept="image/*"
            onChange={(e) => setForm({ ...form, profile_picture: e.target.files[0] })}
          />
          {fieldErrors.profile_picture && (
            <div className="alert alert-danger p-1 mt-1">{fieldErrors.profile_picture[0]}</div>
          )}
        </div>
      
        {/* Submit Button */}
        <div className="col-12">
          <button className="btn btn-success w-100" type="submit">
            <i className="fa-solid fa-save me-2"></i> Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
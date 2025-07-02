import React, { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link, useSearchParams, Outlet } from "react-router-dom";
import ShowEmployeeModal from "../../components/ShowEmployeeModal";
import api from "../../api";
import "./Employee.css";

export default function Employees() {
  const navigate = useNavigate();
  const [showModel, setShowModel] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page")) || 1;
  const searchInputRef = useRef(null);
  const queryClient = useQueryClient();

  /* ============ Queries ============ */
  const search = searchParams.get("query") || "";
  const { data: employeeData } = useQuery({
    queryKey: ["employees", page, search],
    queryFn: () =>
      api
        .get(`/employees?page=${page}${search ? `&search=${search}` : ""}`)
        .then((r) => r.data),
    keepPreviousData: true,
  });

  const { data: departmentsData } = useQuery({
    queryKey: ["departments"],
    queryFn: () => api.get("/departments").then((r) => r.data),
  });

  useEffect(() => {
    if (employeeData?.last_page) setTotalPages(employeeData.last_page);
  }, [employeeData]);

  /* ============ Handlers ============ */
  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this employee?")) {
      try {
        await api.delete(`/employees/${id}`);
        queryClient.invalidateQueries(["employees"]);
      } catch {
        alert("Failed to delete employee");
      }
    }
  };

  const handleEdit = (id) => navigate(`/employees/edit/${id}`);
  const handleShow = (emp) => {
    setSelectedEmployee(emp);
    setShowModel(true);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchInputRef.current?.value.trim().toLowerCase();
    if (!q) return;
    setSearchParams({ page: 1, query: q });
  };

  const handleReset = () => {
    setSearchText("");
    searchInputRef.current && (searchInputRef.current.value = "");
  };

  /* ============ Today Counter ============ */
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const todayNewEmployees =
    (employeeData?.data || []).filter((e) => {
      const d = e.created_at && new Date(e.created_at);
      return d && d >= start && d < end;
    }).length || 0;

  /* ============ Table Filter ============ */
  const list = (employeeData?.data || []).filter((e) =>
    `${e.first_name} ${e.last_name}`
      .toLowerCase()
      .includes(searchText.toLowerCase())
  );

  return (
    <div className="employee-page-wrapper">
      {/* -------- Header & Search -------- */}
      <div className="employee-header">
        <div className="row align-items-start mb-4">
          <div className="col-12 col-md-6 mb-3 mb-md-0">
            <div className="employee-header-title">
              <span className="employee-header-icon">
                <i className="fa-solid fa-users" />
              </span>
              <h2>Employees</h2>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <form className="employee-form d-flex" onSubmit={handleSearch}>
              <input
                ref={searchInputRef}
                className="employee-form-input form-control me-2 border-2"
                type="search"
                placeholder="Search by name..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <button className="employee-form-button btn-small" type="submit">
                Search
              </button>
              <button
                className="employee-form-button btn-small ms-2"
                type="button"
                onClick={handleReset}
              >
                Reset
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* -------- Stat Cards -------- */}
      <div className="mb-4 d-flex flex-wrap gap-3 justify-content-between align-items-start">
        {/* total employees */}
        <div
          className="card text-dark employee-stat-card"
          style={{ borderTop: "4px solid #ac70c6" }}
        >
          <div className="card-body d-flex flex-column align-items-start">
            <div className="d-flex align-items-center mb-2">
              <i
                className="fa-solid fa-circle-user fa-3x me-3"
                style={{ color: "#6b48a3" }}
              />
              <div>
                <p className="mb-1 fw-semibold text-muted">Total Employees</p>
                <h5 className="card-title mb-0" style={{ color: "#ac70c6" }}>
                  {employeeData?.total ?? "..."}
                </h5>
              </div>
            </div>
            <p className="card-text small text-muted text-center w-100 mt-2">
              Number of all employees in the system
            </p>
          </div>
        </div>

        {/* total departments */}
        <div
          className="card text-dark employee-stat-card"
          style={{ borderTop: "4px solid #9b59b6" }}
        >
          <div className="card-body d-flex flex-column align-items-start">
            <div className="d-flex align-items-center mb-2">
              <i
                className="fa-solid fa-building fa-3x me-3"
                style={{ color: "#6b48a3" }}
              />
              <div>
                <p className="mb-1 fw-semibold text-muted">Total Departments</p>
                <h5 className="card-title mb-0" style={{ color: "#9b59b6" }}>
                  {departmentsData?.length ?? "..."}
                </h5>
              </div>
            </div>
            <p className="card-text small text-muted text-center w-100 mt-2">
              Number of departments in the system
            </p>
          </div>
        </div>

        {/* new today */}
        <div
          className="card text-dark employee-stat-card"
          style={{ borderTop: "4px solid #8e44ad" }}
        >
          <div className="card-body d-flex flex-column align-items-start">
            <div className="d-flex align-items-center mb-2">
              <i
                className="fa-solid fa-user-plus fa-3x me-3"
                style={{ color: "#6b48a3" }}
              />
              <div>
                <p className="mb-1 fw-semibold text-muted">New Today</p>
                <h5 className="card-title mb-0" style={{ color: "#8e44ad" }}>
                  {todayNewEmployees}
                </h5>
              </div>
            </div>
            <p className="card-text small text-muted text-center w-100 mt-2">
              Employees added today
            </p>
          </div>
        </div>
      </div>

      {/* -------- Add Employee -------- */}
      <div className="mt-3">
        <Link to="/employees/add">
          <button className="employee-form-button">
            <i className="fa fa-plus me-2" /> Add Employee
          </button>
        </Link>
      </div>

      {/* -------- Employee Table -------- */}
      <table
        className="table table-light ps-5 mt-4"
        style={{
          borderRadius: "30px",
          boxShadow: "0 4px 10px rgba(172,112,198,.1)",
        }}
      >
        <thead
          style={{
            backgroundColor: "#f8f9fa",
            borderBottom: "2px solid #6b48a3",
          }}
        >
          <tr>
            <th style={{ color: "#ac70c6", fontWeight: 600 }}>#</th>
            <th style={{ color: "#ac70c6", fontWeight: 600 }}>Name</th>
            <th style={{ color: "#ac70c6", fontWeight: 600 }}>Department</th>
            <th style={{ color: "#ac70c6", fontWeight: 600 }}>Email</th>
            <th style={{ color: "#ac70c6", fontWeight: 600 }}>Phone</th>
            <th style={{ color: "#ac70c6", fontWeight: 600 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {list?.map((emp, idx) => (
            <tr key={emp.id}>
              <td>{idx + 1}</td>
              <td>
                <img
                  src={`http://127.0.0.1:8000/storage/${emp.profile_picture}`}
                  alt="avatar"
                  width="50"
                  height="50"
                  className="rounded-circle me-2"
                  style={{ border: "2px solid #6b48a3" }}
                />
                {emp.first_name} {emp.last_name}
              </td>
              <td>{emp.department?.dept_name ?? "-"}</td>
              <td>{emp.email ?? "-"}</td>
              <td>{emp.phone ?? "-"}</td>
              <td>
                <button
                  className="employee-action-button view me-2"
                  onClick={() => handleShow(emp)}
                >
                  <i className="fa-solid fa-eye" />
                </button>
                <button
                  className="employee-action-button edit me-2"
                  onClick={() => handleEdit(emp.id)}
                >
                  <i className="fa-solid fa-user-pen" />
                </button>
                <button
                  className="employee-action-button delete"
                  onClick={() => handleDelete(emp.id)}
                >
                  <i className="fa-solid fa-trash-can" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* -------- Pagination -------- */}
      <div className="d-flex justify-content-center flex-wrap mt-4">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            className="employee-form-button mx-1"
            style={{
              backgroundColor: p === page ? "#ac70c6" : "transparent",
              color: p === page ? "#fff" : "#ac70c6",
              border: "2px solid #6b48a3",
            }}
            onClick={() => setSearchParams({ page: p })}
          >
            {p}
          </button>
        ))}
      </div>

      {/* -------- Modal -------- */}
      <ShowEmployeeModal
        show={showModel}
        onHide={() => setShowModel(false)}
        employee={selectedEmployee}
      />
      <Outlet />
    </div>
  );
}
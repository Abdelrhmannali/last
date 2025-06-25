import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link, useSearchParams, Outlet } from "react-router-dom";
import ShowEmployeeModal from "../../components/ShowEmployeeModal";
import api from "../../api";

    import "./Employee.css"; // Assuming you have some styles for this component
export default function Employees() {
  const navigate = useNavigate();
  const [showModel, setShowModel] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page")) || 1;

  function getAllEmployees(page = 1) {
    return api.get(`/employees?page=${page}`).then((res) => res.data);
  }

  const { isLoading, isError, data, isFetching, refetch } = useQuery({
    queryKey: ["employees", page],
    queryFn: () => getAllEmployees(page),
    keepPreviousData: true,
  });

  useEffect(() => {
    if (data?.last_page) setTotalPages(data.last_page);
  }, [data]);

  function deleteEmployee(id) {
    return api.delete(`/employees/${id}`);
  }

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this employee?")) {
      try {
        await deleteEmployee(id);
        refetch();
      } catch (error) {
        console.error("Error deleting employee:", error);
        alert("Failed to delete employee");
      }
    }
  };

  const handleEdit = (id) => {
    navigate(`/employees/edit/${id}`);
  };

  const handleShow = (employee) => {
    setSelectedEmployee(employee);
    setShowModel(true);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const searchQuery = e.target.elements[0].value.toLowerCase();

    api
      .get(`/employees/search?query=${searchQuery}`)
      .then((res) => setEmployees(res.data.data.data))
      .catch((err) => console.error("Search error:", err.response?.data));
  };

  if (isLoading || isFetching) return <div>Loading...</div>;
  if (isError) return <div>Error loading employees</div>;

  return (
 <div className="employees-page">
  <div className="employees-header d-flex justify-content-between align-items-center w-100 flex-wrap">
    <h2 className="mt-4 text-primary employees-title">
      <i className="fa-solid fa-users me-2"></i> Employees
    </h2>
    <Link to="/employees/add" className="employees-add-link">
      <button className="btn btn-primary mt-4 employees-add-btn">Add Employee</button>
    </Link>
  </div>

  <form className="d-flex my-4 employees-search-form" role="search" onSubmit={handleSearch}>
    <input
      className="form-control me-2 employees-search-input"
      type="search"
      placeholder="Search by name..."
      aria-label="Search"
    />
    <button className="btn btn-outline-primary employees-search-btn" type="submit">
      Search
    </button>
    <button
      className="btn btn-outline-secondary ms-2 employees-reset-btn"
      type="button"
      onClick={() => {
        setEmployees([]);
        refetch();
      }}
    >
      Reset
    </button>
  </form>

  <table className="table table-bordered mt-3 employees-table">
    <thead className="table-primary">
      <tr>
        <th>#</th>
        <th>Name</th>
        <th>Department</th>
        <th>Email</th>
        <th>Phone</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody className="table-light">
      {(employees.length > 0 ? employees : data?.data)?.map((employee, index) => (
        <tr key={employee.id} className="employees-row">
          <td>{index + 1}</td>
          <td>
            <img
              src={`http://127.0.0.1:8000/storage/${employee.profile_picture}`}
              width="50"
              height="50"
              className="rounded-circle me-2 employee-avatar"
              alt=""
            />
            {employee.first_name} {employee.last_name}
          </td>
          <td>{employee.department?.dept_name}</td>
          <td>{employee.email}</td>
          <td>{employee.phone}</td>
          <td>
            <button
              className="btn btn-sm btn-primary me-2 employee-show-btn"
              onClick={() => handleShow(employee)}
            >
              <i className="fa-solid fa-eye"></i>
            </button>
            <button
              className="btn btn-sm btn-warning me-2 employee-edit-btn"
              onClick={() => handleEdit(employee.id)}
            >
              <i className="fa-solid fa-user-pen"></i>
            </button>
            <button
              className="btn btn-sm btn-danger employee-delete-btn"
              onClick={() => handleDelete(employee.id)}
            >
              <i className="fa-solid fa-trash-can"></i>
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>

  <div className="d-flex justify-content-center mt-4 flex-wrap employees-pagination">
    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
      <button
        key={p}
        className={`btn btn-sm mx-1 employees-page-btn ${
          p === page ? "btn-primary" : "btn-outline-primary"
        }`}
        onClick={() => {
          setSearchParams({ page: p });
          refetch();
        }}
      >
        {p}
      </button>
    ))}
  </div>

  <ShowEmployeeModal
    show={showModel}
    onHide={() => setShowModel(false)}
    employee={selectedEmployee}
  />
  <Outlet />
</div>

  );
}

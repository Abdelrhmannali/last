import React, { useEffect, useState, useCallback } from "react";
import { Table, Form, Button, Spinner, Pagination } from "react-bootstrap";
import { FaFileExcel, FaUsers, FaMoneyBillWave } from "react-icons/fa";
import api from "../../api";
import * as XLSX from "xlsx";
import "./Payroll.css";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function PayrollTable() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentMonth, setCurrentMonth] = useState("");
  const [allMonths, setAllMonths] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const itemsPerPage = 10;

  const fetchMonths = useCallback(async () => {
    try {
      const [currentMonthRes, allMonthsRes] = await Promise.all([
        api.get("/payroll/current-month"),
        api.get("/payroll/all-months"),
      ]);
      setCurrentMonth(currentMonthRes.data.data.current_month);
      setAllMonths(allMonthsRes.data.data);
    } catch (e) {
      console.error("Error fetching months data", e);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/payroll/summary", {
        params: { month: currentMonth },
      });
      setEmployees(data?.data || []);
    } catch (e) {
      console.error("Error fetching payroll data", e);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchMonths();
  }, [fetchMonths]);

  useEffect(() => {
    if (currentMonth) {
      fetchData();
    }
  }, [fetchData, currentMonth]);

  // جلب بيانات الموظفين (id, first_name, last_name, profile_picture)
  useEffect(() => {
    api
      .get("/employees?fields=id,first_name,last_name,profile_picture")
      .then((res) => setAllEmployees(res.data.data || []))
      .catch(() => setAllEmployees([]));
  }, []);

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      employees.map((emp) => ({
        Name: emp.employee_full_name,
        Department: emp.dep_name,
        Month: emp.month,
        "Month Days": emp.month_days,
        Attendance: emp.attended_days,
        Absence: emp.absent_days,
        Bonus: emp.total_bonus_amount,
        Deduction: emp.total_deduction_amount,
        Salary: emp.salary,
        "Net Salary": emp.net_salary,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payroll");
    XLSX.writeFile(wb, `PayrollData_${currentMonth}.xlsx`);
  };

  const filtered = employees.filter((emp) =>
    emp.employee_full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getImageUrl = (emp) => {
    // ابحث عن الموظف في allEmployees
    const found = allEmployees.find(
      (e) =>
        (emp.id && e.id === emp.id) ||
        (emp.employee_full_name &&
          `${e.first_name} ${e.last_name}`.trim() === emp.employee_full_name.trim())
    );
    if (found && found.profile_picture)
      return `http://localhost:8000/storage/${found.profile_picture}`;
    // إذا موجود في بيانات الـ Payroll
    if (emp.profile_image_url) return emp.profile_image_url;
    if (emp.profile_picture_url) return emp.profile_picture_url;
    if (emp.profile_picture)
      return `http://localhost:8000/storage/${emp.profile_picture}`;
    // صورة افتراضية باسم الموظف
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      emp.employee_full_name || emp.full_name || emp.name || "User"
    )}&background=ac70c6&color=fff&rounded=true`;
  };

  const averageSalary = employees.length
    ? (
        employees.reduce((sum, e) => sum + parseFloat(e.net_salary || 0), 0) /
        employees.length
      ).toLocaleString()
    : 0;

  return (
    <div className="payroll-page-wrapper">
      {/* Header */}
      <div className="payroll-header">
        <div className="payroll-header-title">
          <span className="payroll-header-icon">
            <FaMoneyBillWave />
          </span>
          <h2>Payroll Dashboard</h2>
        </div>
      </div>

      {/* Stats */}
      <div className="payroll-stats-container">
        <div className="payroll-stat-card">
          <FaUsers
            size={38}
            style={{ color: "#6b48a3", marginBottom: "0.5rem" }}
          />
          <p>Total Employees</p>
          <h3 style={{ fontSize: "2.5rem" }}>{employees.length}</h3>
        </div>

        <div className="payroll-stat-card">
          <FaMoneyBillWave
            size={38}
            style={{ color: "#6b48a3", marginBottom: "0.5rem" }}
          />
          <p>Total Net Salaries</p>
          <h3 style={{ fontSize: "2.5rem" }}>
            {employees
              .reduce((sum, e) => sum + parseFloat(e.net_salary || 0), 0)
              .toLocaleString()}{" "}
            EGP
          </h3>
        </div>

        <div className="payroll-stat-card">
          <FaMoneyBillWave
            size={38}
            style={{ color: "#6b48a3", marginBottom: "0.5rem" }}
          />
          <p>Average Salary</p>
          <h3 style={{ fontSize: "2.5rem" }}>{averageSalary} EGP</h3>
        </div>
      </div>

      {/* Filter Form */}
      <div className="payroll-form mt-4">
        <Form.Control
          type="text"
          placeholder="Search employee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="payroll-form-input flex-grow-1"
          style={{ minWidth: "200px" }}
        />
        <Form.Select
          value={currentMonth}
          onChange={(e) => {
            setCurrentMonth(e.target.value);
            setCurrentPage(1);
          }}
          className="payroll-form-input"
          style={{ width: "180px" }}
        >
          <option value="">Select Month</option>
          {allMonths.map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </Form.Select>
        <Button
          onClick={exportToExcel}
          className="payroll-form-button"
          style={{ whiteSpace: "nowrap", width: "130px" }}
        >
          <FaFileExcel className="me-2" /> Export
        </Button>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="payroll-loading-container">
          <div className="payroll-spinner"></div>
          <p>Loading payroll data...</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="payroll-table-container mt-4">
            <Table responsive hover className="payroll-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Month</th>
                  <th>Month Days</th>
                  <th>Attendance</th>
                  <th>Absence</th>
                  <th>Bonus</th>
                  <th>Deduction</th>
                  <th>Base Salary</th>
                  <th>Net Salary</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <img
                        src={getImageUrl(emp)}
                        alt="avatar"
                        className="payroll-employee-avatar me-2"
                        width="35"
                        height="35"
                        style={{ borderRadius: "50%" }}
                      />
                      {emp.employee_full_name}
                    </td>
                    <td>{emp.dep_name || "-"}</td>
                    <td>{emp.month ?? "-"}</td>
                    <td>{emp.month_days ?? "-"}</td>
                    <td>{emp.attended_days ?? "-"}</td>
                    <td>{emp.absent_days ?? "-"}</td>
                    <td>
                      <span className="payroll-badge payroll-bonus">
                        {emp.total_bonus_amount ?? 0} EGP
                      </span>
                    </td>
                    <td>
                      <span className="payroll-badge payroll-deduction">
                        {emp.total_deduction_amount ?? 0} EGP
                      </span>
                    </td>
                    <td>
                      <span className="payroll-badge payroll-salary">
                        {emp.salary ?? 0} EGP
                      </span>
                    </td>
                    <td>
                      <span className="payroll-badge payroll-net-salary">
                        {emp.net_salary ?? 0} EGP
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination className="justify-content-center mt-4">
              <Pagination.First
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              />
              <Pagination.Prev
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              />
              {[...Array(totalPages)].map((_, i) => (
                <Pagination.Item
                  key={i + 1}
                  active={currentPage === i + 1}
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
    </div>
  );
}

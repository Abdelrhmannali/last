import { useState, useEffect } from "react";
import {
  PieChartFill,
  PersonFill,
  BuildingFill,
  CalendarFill,
  ClockFill,
  CurrencyDollar,
  ArrowClockwise,
} from "react-bootstrap-icons";
import api from "../../api";
import "./DashboardPage.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalDepartments: 0,
    totalHolidays: 0,
    totalLateHours: 0,
    totalOvertimeHours: 0,
    presentCount: 0,
    absentCount: 0,
    highestSalary: 0,
    lowestSalary: 0,
    totalSalaries: 0,
    totalNetSalaries: 0,
    averageSalary: 0,
    largestDepartment: { name: "N/A", count: 0 },
    mostAbsentDept: { name: "N/A", count: 0 },
    bestEmployeeName: "No employee with attendance",
  });
  const [recentAttendances, setRecentAttendances] = useState([]);
  const [barData, setBarData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [attendances, setAttendances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState("monthly");

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMonth, selectedYear, viewMode]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      let employeesData = [];
      try {
        const employeesRes = await api.get("/employees");
        employeesData = Array.isArray(employeesRes.data.data)
          ? employeesRes.data.data
          : Array.isArray(employeesRes.data)
          ? employeesRes.data
          : [];
        if (!employeesData.length) {
          console.warn("No employee data received");
          toast.warn("No employee data available", { toastId: "no-employees" });
        }
        setEmployees(employeesData);
      } catch (error) {
        console.error("Error fetching employees:", error);
        toast.error("Failed to fetch employees", { toastId: "employees-error" });
      }

      let departments = [];
      try {
        const departmentsRes = await api.get("/departments");
        departments = Array.isArray(departmentsRes.data.data)
          ? departmentsRes.data.data
          : Array.isArray(departmentsRes.data)
          ? departmentsRes.data
          : [];
        if (!departments.length) {
          console.warn("No department data received");
        }
      } catch (error) {
        console.warn("Departments API error:", error);
      }

      let holidays = [];
      try {
        const holidaysRes = await api.get("/holidays");
        holidays = Array.isArray(holidaysRes.data.data)
          ? holidaysRes.data.data
          : Array.isArray(holidaysRes.data)
          ? holidaysRes.data
          : [];
        if (!holidays.length) {
          console.warn("No holiday data received");
        }
      } catch (error) {
        console.warn("Holidays API error:", error);
      }

      let attendancesData = [];
      try {
        const attendancesRes = await api.get("/attendances", { params: { page: 1 } });
        attendancesData = Array.isArray(attendancesRes.data.data)
          ? attendancesRes.data.data
          : Array.isArray(attendancesRes.data)
          ? attendancesRes.data
          : [];
        if (!attendancesData.length) {
          console.warn("No attendance data received");
          toast.warn("No attendance data available", { toastId: "no-attendances" });
        }
        setAttendances(attendancesData);
      } catch (error) {
        console.error("Error fetching attendances:", error);
        toast.error("Failed to fetch attendances", { toastId: "attendances-error" });
      }

      let payroll = [];
      try {
        const payrollRes = await api.get("/payroll/summary");
        payroll = Array.isArray(payrollRes.data.data)
          ? payrollRes.data.data
          : Array.isArray(payrollRes.data)
          ? payrollRes.data
          : [];
        if (!payroll.length) {
          console.warn("No payroll data received");
        }
      } catch (error) {
        console.warn("Payroll API error:", error);
      }

      let filteredAttendances = attendancesData;
      let filteredHolidays = holidays;
      let filteredPayroll = payroll;

      if (viewMode === "monthly") {
        filteredAttendances = attendancesData.filter((a) => {
          const date = new Date(a.date || a.created_at || new Date());
          return date.getMonth() + 1 === selectedMonth && date.getFullYear() === selectedYear;
        });
        filteredHolidays = holidays.filter((h) => {
          const date = new Date(h.date || h.created_at || new Date());
          return date.getMonth() + 1 === selectedMonth && date.getFullYear() === selectedYear;
        });
        filteredPayroll = payroll.filter((p) => {
          const date = new Date(p.date || p.created_at || new Date());
          return date.getMonth() + 1 === selectedMonth && date.getFullYear() === selectedYear;
        });
      } else {
        filteredAttendances = attendancesData.filter((a) => {
          const date = new Date(a.date || a.created_at || new Date());
          return date.getFullYear() === selectedYear;
        });
        filteredHolidays = holidays.filter((h) => {
          const date = new Date(h.date || h.created_at || new Date());
          return date.getFullYear() === selectedYear;
        });
        filteredPayroll = payroll.filter((p) => {
          const date = new Date(p.date || p.created_at || new Date());
          return date.getFullYear() === selectedYear;
        });
      }

      const totalLateHours = filteredAttendances.reduce((sum, a) => sum + (parseFloat(a.lateDurationInHours) || 0), 0);
      const totalOvertimeHours = filteredAttendances.reduce((sum, a) => sum + (parseFloat(a.overtimeDurationInHours) || 0), 0);
      const presentCount = filteredAttendances.filter((a) => a.status === "Present").length;
      const absentCount = filteredAttendances.filter((a) => a.status === "Absent").length;

      const employeeSalaries = employeesData
        .map((emp) => parseFloat(emp.salary || 0))
        .filter((s) => !isNaN(s) && s > 0);
      const highestSalary = employeeSalaries.length ? Math.max(...employeeSalaries) : 0;
      const lowestSalary = employeeSalaries.length ? Math.min(...employeeSalaries) : 0;
      const totalSalaries = employeeSalaries.reduce((sum, s) => sum + s, 0) || 0;
      const averageSalary = employeeSalaries.length ? totalSalaries / employeeSalaries.length : 0;

      const totalNetSalaries = filteredPayroll.reduce((sum, emp) => {
        const net = parseFloat(emp.net_salary || 0);
        return sum + (!isNaN(net) ? net : 0);
      }, 0);

      const departmentCounts = {};
      employeesData.forEach((emp) => {
        const dept = emp.department?.dept_name || emp.dep_name || emp.department_name || "Unknown";
        departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
      });
      const largestDepartment = Object.entries(departmentCounts).reduce(
        (max, [name, count]) => (count > max.count ? { name, count } : max),
        { name: "N/A", count: 0 }
      );

      const departmentLateHours = {};
      filteredAttendances.forEach((a) => {
        const dept = a.employee?.dept_name || a.employee?.department?.dept_name || "Unknown";
        departmentLateHours[dept] = (departmentLateHours[dept] || 0) + (parseFloat(a.lateDurationInHours) || 0);
      });
      const barChartData = Object.entries(departmentLateHours).map(([name, hours]) => ({
        name,
        lateHours: parseFloat(hours.toFixed(2)),
      }));

      const departmentAbsenceMap = {};
      filteredAttendances
        .filter((a) => a.status === "Absent")
        .forEach((a) => {
          const dept = a.employee?.dept_name || a.employee?.department?.dept_name || "Unknown";
          departmentAbsenceMap[dept] = (departmentAbsenceMap[dept] || 0) + 1;
        });
      const mostAbsentDept = Object.entries(departmentAbsenceMap).reduce(
        (max, [name, count]) => (count > max.count ? { name, count } : max),
        { name: "N/A", count: 0 }
      );

      const employeeLateMap = {};
      filteredAttendances.forEach((a) => {
        const empId = a.employee?.id || a.employee_id;
        if (!empId) return;
        employeeLateMap[empId] = (employeeLateMap[empId] || 0) + (parseFloat(a.lateDurationInHours) || 0);
      });
      let bestEmployeeName = "No employee with attendance";
      if (Object.keys(employeeLateMap).length > 0) {
        const best = Object.entries(employeeLateMap).reduce(
          (min, [id, late]) => (late < min.late ? { id, late } : min),
          { id: null, late: Infinity }
        );
        if (best.id !== null && best.late !== Infinity) {
          const found = employeesData.find((e) => String(e.id) === String(best.id));
          if (found) {
            bestEmployeeName =
              found.full_name ||
              (found.first_name && found.last_name
                ? `${found.first_name} ${found.last_name}`
                : found.id);
          } else {
            bestEmployeeName = best.id;
          }
        }
      }

      setStats({
        totalEmployees: employeesData.length,
        totalDepartments: departments.length,
        totalHolidays: filteredHolidays.length,
        totalLateHours,
        totalOvertimeHours,
        presentCount,
        absentCount,
        highestSalary,
        lowestSalary,
        totalSalaries,
        totalNetSalaries,
        averageSalary,
        largestDepartment,
        mostAbsentDept,
        bestEmployeeName,
      });
      setRecentAttendances(filteredAttendances.slice(0, 5));
      setBarData(barChartData);

      toast.success("Dashboard data loaded successfully!", {
        position: "top-right",
        autoClose: 1500,
        toastId: "dashboard-loaded"
      });
    } catch (error) {
      console.error("Error in fetchDashboardData:", error);
      toast.error(error.response?.data?.error || "Failed to load dashboard data", {
        position: "top-right",
        autoClose: 1500,
        toastId: "dashboard-error"
      });
    } finally {
      setLoading(false);
    }
  };

  const pieData = [
    { name: "Present", value: stats.presentCount },
    { name: "Absent", value: stats.absentCount },
  ];
  const COLORS = ["#4C51BF", "#F56565"];

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const handleMonthChange = (e) => {
    setSelectedMonth(parseInt(e.target.value));
  };

  const handleYearChange = (e) => {
    setSelectedYear(parseInt(e.target.value));
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  const years = Array.from({ length: 10 }, (_, i) => selectedYear - i);

  return (
    <div className="dash-page-wrapper">
      <ToastContainer />
      <header className="dash-header">
        <div className="dash-header-title">
          <PieChartFill className="dash-header-icon" />
          <h1>HR Analytics Dashboard</h1>
        </div>
        <div className="dash-controls">
          <div className="dash-view-toggle">
            <button
              className={`dash-toggle-button ${viewMode === "monthly" ? "active" : ""}`}
              onClick={() => handleViewModeChange("monthly")}
            >
              Monthly
            </button>
            <button
              className={`dash-toggle-button ${viewMode === "annual" ? "active" : ""}`}
              onClick={() => handleViewModeChange("annual")}
            >
              Annual
            </button>
          </div>
          {viewMode === "monthly" && (
            <div className="dash-month-selector">
              <select value={selectedMonth} onChange={handleMonthChange}>
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
              <select value={selectedYear} onChange={handleYearChange}>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button className="dash-action-button" onClick={handleRefresh} disabled={loading}>
            <ArrowClockwise className="dash-action-icon" />
            Refresh Data
          </button>
        </div>
      </header>

      <div className="dash-welcome-banner">
        <h2>Welcome to Your HR Analytics Hub</h2>
        <p>
          Explore {viewMode === "monthly" ? "monthly" : "annual"} insights for{" "}
          {viewMode === "monthly"
            ? `${months.find((m) => m.value === selectedMonth)?.label} ${selectedYear}`
            : `${selectedYear}`}
          {" "}to optimize workforce performance and streamline operations.
        </p>
      </div>

      <div className="dash-stats-section">
        <div className="dash-stats-group">
          <h4 className="dash-stats-group-title">Organization Overview</h4>
          <p className="dash-stats-description">
            Get a snapshot of your organization's structure, including employee count, departments, and scheduled holidays.
          </p>
          <div className="dash-stats-container">
            <div className="dash-stat-card">
              {loading && <div className="dash-card-spinner" />}
              <PersonFill className="dash-stat-icon" />
              <h4 className="dash-stat-label">Total Employees</h4>
              <h3 className="dash-stat-value">{stats.totalEmployees}</h3>
            </div>
            <div className="dash-stat-card">
              {loading && <div className="dash-card-spinner" />}
              <BuildingFill className="dash-stat-icon" />
              <h4 className="dash-stat-label">Total Departments</h4>
              <h3 className="dash-stat-value">{stats.totalDepartments}</h3>
            </div>
            <div className="dash-stat-card">
              {loading && <div className="dash-card-spinner" />}
              <CalendarFill className="dash-stat-icon" />
              <h4 className="dash-stat-label">Total Holidays</h4>
              <h3 className="dash-stat-value">{stats.totalHolidays}</h3>
            </div>
          </div>
        </div>

        <div className="dash-stats-group">
          <h4 className="dash-stats-group-title">Attendance Insights</h4>
          <p className="dash-stats-description">
            Monitor attendance metrics to identify trends in punctuality and recognize top performers.
          </p>
          <div className="dash-stats-container">
            <div className="dash-stat-card">
              {loading && <div className="dash-card-spinner" />}
              <ClockFill className="dash-stat-icon" />
              <h4 className="dash-stat-label">Total Late Hours</h4>
              <h3 className="dash-stat-value">{stats.totalLateHours.toFixed(2)}h</h3>
            </div>
            <div className="dash-stat-card">
              {loading && <div className="dash-card-spinner" />}
              <ClockFill className="dash-stat-icon" />
              <h4 className="dash-stat-label">Total Overtime Hours</h4>
              <h3 className="dash-stat-value">{stats.totalOvertimeHours.toFixed(2)}h</h3>
            </div>
            <div className="dash-stat-card">
              {loading && <div className="dash-card-spinner" />}
              <PersonFill className="dash-stat-icon" />
              <h4 className="dash-stat-label">Best Employee</h4>
              <h3 className="dash-stat-value">{stats.bestEmployeeName}</h3>
            </div>
          </div>
        </div>

        <div className="dash-stats-group">
          <h4 className="dash-stats-group-title">Payroll Summary</h4>
          <p className="dash-stats-description">
            Review salary distributions and financial metrics to ensure fair compensation and budget alignment.
          </p>
          <div className="dash-stats-container">
            <div className="dash-stat-card">
              {loading && <div className="dash-card-spinner" />}
              <CurrencyDollar className="dash-stat-icon" />
              <h4 className="dash-stat-label">Highest Salary</h4>
              <h3 className="dash-stat-value">${Number(stats.highestSalary).toFixed(2)}</h3>
            </div>
            <div className="dash-stat-card">
              {loading && <div className="dash-card-spinner" />}
              <CurrencyDollar className="dash-stat-icon" />
              <h4 className="dash-stat-label">Lowest Salary</h4>
              <h3 className="dash-stat-value">${Number(stats.lowestSalary).toFixed(2)}</h3>
            </div>
            <div className="dash-stat-card">
              {loading && <div className="dash-card-spinner" />}
              <CurrencyDollar className="dash-stat-icon" />
              <h4 className="dash-stat-label">Total Salaries</h4>
              <h3 className="dash-stat-value">${Number(stats.totalSalaries).toFixed(2)}</h3>
            </div>
            <div className="dash-stat-card">
              {loading && <div className="dash-card-spinner" />}
              <CurrencyDollar className="dash-stat-icon" />
              <h4 className="dash-stat-label">Total Net Salaries</h4>
              <h3 className="dash-stat-value">{Number(stats.totalNetSalaries).toLocaleString()} EGP</h3>
            </div>
            <div className="dash-stat-card">
              {loading && <div className="dash-card-spinner" />}
              <CurrencyDollar className="dash-stat-icon" />
              <h4 className="dash-stat-label">Average Salary</h4>
              <h3 className="dash-stat-value">{Number(stats.averageSalary).toLocaleString()} EGP</h3>
            </div>
          </div>
        </div>

        <div className="dash-stats-group">
          <h4 className="dash-stats-group-title">Department Insights</h4>
          <p className="dash-stats-description">
            Analyze department performance to optimize resource allocation and address absenteeism.
          </p>
          <div className="dash-stats-container">
            <div className="dash-stat-card">
              {loading && <div className="dash-card-spinner" />}
              <BuildingFill className="dash-stat-icon" />
              <h4 className="dash-stat-label">Largest Department</h4>
              <h3 className="dash-stat-value">
                {stats.largestDepartment.name} ({stats.largestDepartment.count})
              </h3>
            </div>
            <div className="dash-stat-card">
              {loading && <div className="dash-card-spinner" />}
              <BuildingFill className="dash-stat-icon" />
              <h4 className="dash-stat-label">Most Absent Department</h4>
              <h3 className="dash-stat-value">
                {stats.mostAbsentDept.name} ({stats.mostAbsentDept.count})
              </h3>
            </div>
          </div>
        </div>

        <div className="dash-charts-section">
          <h4 className="dash-stats-group-title">Visual Analytics</h4>
          <p className="dash-stats-description">
            Visualize attendance and punctuality trends to make data-driven decisions.
          </p>
          <div className="dash-charts-container">
            <div className="dash-chart-card">
              {loading && <div className="dash-card-spinner" />}
              <h3>Attendance Distribution</h3>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={90}
                    outerRadius={130}
                    fill="#4C51BF"
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={1000}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid #E2E8F0",
                      borderRadius: "12px",
                      boxShadow: "0 6px 16px rgba(0, 0, 0, 0.1)",
                      padding: "1rem",
                    }}
                    labelStyle={{ color: "#2D3748", fontWeight: 600 }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="dash-chart-card">
              {loading && <div className="dash-card-spinner" />}
              <h3>Late Hours by Department</h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(113, 128, 150, 0.2)" />
                  <XAxis dataKey="name" tick={{ fontSize: 14, fill: "#4A5568" }} angle={-45} textAnchor="end" />
                  <YAxis tick={{ fontSize: 14, fill: "#4A5568" }} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid #E2E8F0",
                      borderRadius: "12px",
                      boxShadow: "0 6px 16px rgba(0, 0, 0, 0.1)",
                      padding: "1rem",
                    }}
                    labelStyle={{ color: "#2D3748", fontWeight: 600 }}
                  />
                  <Bar
                    dataKey="lateHours"
                    fill="#667EEA"
                    radius={[8, 8, 0, 0]}
                    animationDuration={1000}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
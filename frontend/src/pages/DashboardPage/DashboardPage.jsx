import { useState, useEffect } from "react";
import { FaChartPie, FaUser, FaBuilding, FaCalendar, FaClock, FaDollarSign, FaSyncAlt } from "react-icons/fa";
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
  });
  const [recentAttendances, setRecentAttendances] = useState([]);
  const [barData, setBarData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch employees
      const employeesRes = await api.get("/employees");
      const employees = Array.isArray(employeesRes.data.data) ? employeesRes.data.data : employeesRes.data;

      // Fetch departments
      let departments = [];
      try {
        const departmentsRes = await api.get("/departments");
        departments = Array.isArray(departmentsRes.data.data) ? departmentsRes.data.data : departmentsRes.data;
      } catch (error) {
        console.warn("Departments API not available, setting to 0");
      }

      // Fetch holidays
      let holidays = [];
      try {
        const holidaysRes = await api.get("/holidays");
        holidays = Array.isArray(holidaysRes.data.data) ? holidaysRes.data.data : holidaysRes.data;
      } catch (error) {
        console.warn("Holidays API not available, setting to 0");
      }

      // Fetch attendances
      const attendancesRes = await api.get("/attendances", { params: { page: 1 } });
      const attendances = attendancesRes.data.data;

      // Fetch payroll summary for salary data
      let payroll = [];
      try {
        const payrollRes = await api.get("/payroll/summary");
        payroll = Array.isArray(payrollRes.data.data) ? payrollRes.data.data : payrollRes.data;
      } catch (error) {
        console.warn("Payroll API not available, setting to empty array");
      }

      // Calculate stats
      const totalLateHours = attendances.reduce((sum, a) => sum + (a.lateDurationInHours || 0), 0);
      const totalOvertimeHours = attendances.reduce((sum, a) => sum + (a.overtimeDurationInHours || 0), 0);
      const presentCount = attendances.filter((a) => a.status === "Present").length;
      const absentCount = attendances.filter((a) => a.status === "Absent").length;

      // Calculate salary stats from employees
      const employeeSalaries = employees
        .map((emp) => (typeof emp.salary === 'number' && !isNaN(emp.salary) ? emp.salary : 0))
        .filter((s) => s > 0);
      const highestSalary = employeeSalaries.length > 0 ? Math.max(...employeeSalaries) : 0;
      const lowestSalary = employeeSalaries.length > 0 ? Math.min(...employeeSalaries) : 0;
      const totalSalaries = employeeSalaries.reduce((sum, s) => sum + s, 0) || 0;

      // Calculate payroll stats
      const totalNetSalaries = payroll
        .reduce((sum, emp) => sum + (typeof emp.net_salary === 'number' && !isNaN(emp.net_salary) ? emp.net_salary : 0), 0);
      const averageSalary = payroll.length
        ? payroll.reduce((sum, emp) => sum + (typeof emp.net_salary === 'number' && !isNaN(emp.net_salary) ? emp.net_salary : 0), 0) / payroll.length
        : 0;

      // Calculate largest department
      const departmentCounts = {};
      employees.forEach((emp) => {
        const dept = emp.dept_name || "Unknown";
        departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
      });
      const largestDepartment = Object.entries(departmentCounts).reduce(
        (max, [name, count]) => (count > max.count ? { name, count } : max),
        { name: "N/A", count: 0 }
      );

 
      const departmentLateHours = {};
      attendances.forEach((a) => {
        const dept = a.employee.dept_name || "Unknown";
        departmentLateHours[dept] = (departmentLateHours[dept] || 0) + (a.lateDurationInHours || 0);
      });
      const barChartData = Object.entries(departmentLateHours).map(([name, hours]) => ({
        name,
        lateHours: parseFloat(hours.toFixed(2)),
      }));

      setStats({
        totalEmployees: employees.length,
        totalDepartments: departments.length,
        totalHolidays: holidays.length,
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
      });
      setRecentAttendances(attendances.slice(0, 5));
      setBarData(barChartData);
      toast.success("Dashboard data loaded successfully", { position: "bottom-end" });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to load dashboard data", { position: "bottom-end" });
    } finally {
      setLoading(false);
    }
  };

  const pieData = [
    { name: "Present", value: stats.presentCount },
    { name: "Absent", value: stats.absentCount },
  ];
  const COLORS = ["#6b48a3", "#ff6b6b"];

  return (
    <div className="dash-page-wrapper">
      <ToastContainer position="bottom-end" className="p-3" autoClose={3000} />
      {loading && (
        <div className="dash-loading-overlay">
          <div className="dash-spinner"></div>
        </div>
      )}
      <header className="dash-header">
        <div className="dash-header-title">
          <FaChartPie className="dash-header-icon" />
          <h3>Dashboard</h3>
        </div>
        <button
          className="dash-action-button dash-refresh-button"
          onClick={fetchDashboardData}
          disabled={loading}
        >
          <FaSyncAlt /> Refresh
        </button>
      </header>

      <div className="dash-stats-container">
        <div className="dash-stat-card">
          <h4 className="dash-stat-label">
            <FaUser className="dash-stat-icon" /> Total Employees
          </h4>
          <h3 className="dash-stat-value">{stats.totalEmployees}</h3>
        </div>
        <div className="dash-stat-card">
          <h4 className="dash-stat-label">
            <FaBuilding className="dash-stat-icon" /> Total Departments
          </h4>
          <h3 className="dash-stat-value">{stats.totalDepartments}</h3>
        </div>
        <div className="dash-stat-card">
          <h4 className="dash-stat-label">
            <FaCalendar className="dash-stat-icon" /> Total Holidays
          </h4>
          <h3 className="dash-stat-value">{stats.totalHolidays}</h3>
        </div>
        <div className="dash-stat-card">
          <h4 className="dash-stat-label">
            <FaClock className="dash-stat-icon" /> Total Late Hours
          </h4>
          <h3 className="dash-stat-value">{stats.totalLateHours.toFixed(2)}h</h3>
        </div>
        <div className="dash-stat-card">
          <h4 className="dash-stat-label">
            <FaClock className="dash-stat-icon" /> Total Overtime Hours
          </h4>
          <h3 className="dash-stat-value">{stats.totalOvertimeHours.toFixed(2)}h</h3>
        </div>
        <div className="dash-stat-card">
          <h4 className="dash-stat-label">
            <ünüz: FaDollarSign className="dash-stat-icon" /> Highest Salary
          </h4>
          <h3 className="dash-stat-value">${Number(stats.highestSalary).toFixed(2)}</h3>
        </div>
        <div className="dash-stat-card">
          <h4 className="dash-stat-label">
            <FaDollarSign className="dash-stat-icon" /> Lowest Salary
          </h4>
          <h3 className="dash-stat-value">${Number(stats.lowestSalary).toFixed(2)}</h3>
        </div>
        <div className="dash-stat-card">
          <h4 className="dash-stat-label">
            <FaDollarSign className="dash-stat-icon" /> Total Salaries
          </h4>
          <h3 className="dash-stat-value">${Number(stats.totalSalaries).toFixed(2)}</h3>
        </div>
        <div className="dash-stat-card">
          <h4 className="dash-stat-label">
            <FaDollarSign className="dash-stat-icon" /> Total Net Salaries
          </h4>
          <h3 className="dash-stat-value">{Number(stats.totalNetSalaries).toLocaleString()} EGP</h3>
        </div>
        <div className="dash-stat-card">
          <h4 className="dash-stat-label">
            <FaDollarSign className="dash-stat-icon" /> Average Salary
          </h4>
          <h3 className="dash-stat-value">{Number(stats.averageSalary).toLocaleString()} EGP</h3>
        </div>
        <div className="dash-stat-card">
          <h4 className="dash-stat-label">
            <FaBuilding className="dash-stat-icon" /> Largest Department
          </h4>
          <h3 className="dash-stat-value">{stats.largestDepartment.name} ({stats.largestDepartment.count})</h3>
        </div>
      </div>

      <div className="dash-charts-container">
        <div className="dash-chart-card">
          <h4 className="dash-section-title">Attendance Distribution</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label
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
        <div className="dash-chart-card">
          <h4 className="dash-section-title">Late Hours by Department</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="lateHours" fill="#6b48a3" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
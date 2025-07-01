import { useState, useEffect } from "react";
import {
  PieChartFill,
  PersonFill,
  BuildingFill,
  CalendarFill,
  ClockFill,
  CurrencyDollar,
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
  });
  const [recentAttendances, setRecentAttendances] = useState([]);
  const [barData, setBarData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [attendances, setAttendances] = useState([]);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch employees
      const employeesRes = await api.get("/employees");
      const employeesData = Array.isArray(employeesRes.data.data)
        ? employeesRes.data.data
        : employeesRes.data;
      setEmployees(employeesData);

      // Fetch departments
      let departments = [];
      try {
        const departmentsRes = await api.get("/departments");
        departments = Array.isArray(departmentsRes.data.data)
          ? departmentsRes.data.data
          : departmentsRes.data;
      } catch (error) {
        console.warn("Departments API not available, setting to 0");
      }

      // Fetch holidays
      let holidays = [];
      try {
        const holidaysRes = await api.get("/holidays");
        holidays = Array.isArray(holidaysRes.data.data)
          ? holidaysRes.data.data
          : holidaysRes.data;
      } catch (error) {
        console.warn("Holidays API not available, setting to 0");
      }

      // Fetch attendances
      const attendancesRes = await api.get("/attendances", { params: { page: 1 } });
      const attendancesData = attendancesRes.data.data || [];
      setAttendances(attendancesData);

      // Fetch payroll summary for salary data
      let payroll = [];
      try {
        const payrollRes = await api.get("/payroll/summary");
        payroll = Array.isArray(payrollRes.data.data)
          ? payrollRes.data.data
          : payrollRes.data;
      } catch (error) {
        console.warn("Payroll API not available, setting to empty array");
      }

      // Calculate stats
      const totalLateHours = attendancesData.reduce((sum, a) => sum + (a.lateDurationInHours || 0), 0);
      const totalOvertimeHours = attendancesData.reduce((sum, a) => sum + (a.overtimeDurationInHours || 0), 0);
      const presentCount = attendancesData.filter((a) => a.status === "Present").length;
      const absentCount = attendancesData.filter((a) => a.status === "Absent").length;

      // Calculate salary stats from employees
      const employeeSalaries = employeesData
        .map((emp) => {
          const salary = parseFloat(emp.salary);
          return !isNaN(salary) ? salary : 0;
        })
        .filter((s) => s > 0);
      const highestSalary = employeeSalaries.length > 0 ? Math.max(...employeeSalaries) : 0;
      const lowestSalary = employeeSalaries.length > 0 ? Math.min(...employeeSalaries) : 0;
      const totalSalaries = employeeSalaries.reduce((sum, s) => sum + s, 0) || 0;

      // Calculate payroll stats
      const totalNetSalaries = payroll.reduce((sum, emp) => {
        const net = parseFloat(emp.net_salary);
        return sum + (!isNaN(net) ? net : 0);
      }, 0);
      const averageNetSalary = payroll.length
        ? payroll.reduce((sum, emp) => {
            const net = parseFloat(emp.net_salary);
            return sum + (!isNaN(net) ? net : 0);
          }, 0) / payroll.length
        : 0;
      const averageBaseSalary = employeeSalaries.length
        ? employeeSalaries.reduce((sum, s) => sum + s, 0) / employeeSalaries.length
        : 0;

      // Calculate largest department
      const departmentCounts = {};
      employeesData.forEach((emp) => {
        const dept =
          emp.department?.dept_name ||
          emp.dep_name ||
          emp.department_name ||
          "Unknown";
        departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
      });
      const largestDepartment = Object.entries(departmentCounts).reduce(
        (max, [name, count]) => (count > max.count ? { name, count } : max),
        { name: "N/A", count: 0 }
      );

      // Calculate late hours per department for bar chart
      const departmentLateHours = {};
      attendancesData.forEach((a) => {
        const dept = a.employee?.dept_name || "Unknown";
        departmentLateHours[dept] = (departmentLateHours[dept] || 0) + (a.lateDurationInHours || 0);
      });
      const barChartData = Object.entries(departmentLateHours).map(([name, hours]) => ({
        name,
        lateHours: parseFloat(hours.toFixed(2)),
      }));

      setStats({
        totalEmployees: employeesData.length,
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
        averageSalary: averageBaseSalary,
        largestDepartment,
      });
      setRecentAttendances(attendancesData.slice(0, 5));
      setBarData(barChartData);

      toast.success("Dashboard data loaded!", {
        position: "top-right",
        autoClose: 1000,
        toastId: "dashboard-loaded"
      });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to load dashboard data", {
        position: "top-right",
        autoClose: 1000,
        toastId: "dashboard-error"
      });
    } finally {
      setLoading(false);
    }
  };

  // حساب أفضل موظف بأقل مجموع ساعات تأخير
  const employeeLateMap = {};
  attendances.forEach((a) => {
    const empId = a.employee?.id || a.employee_id;
    if (!empId) return;
    employeeLateMap[empId] = (employeeLateMap[empId] || 0) + (a.lateDurationInHours || 0);
  });
  let bestEmployeeName = "لا يوجد موظف لديه حضور";
  if (Object.keys(employeeLateMap).length > 0) {
    const best = Object.entries(employeeLateMap).reduce(
      (min, [id, late]) => (late < min.late ? { id, late } : min),
      { id: null, late: Infinity }
    );
    if (best.id !== null && best.late !== Infinity) {
      const found = employees.find((e) => String(e.id) === String(best.id));
      if (found) {
        bestEmployeeName =
          found.full_name ||
          (found.first_name && found.last_name
            ? found.first_name + " " + found.last_name
            : found.id);
      } else {
        bestEmployeeName = best.id;
      }
    }
  }

  const pieData = [
    { name: "Present", value: stats.presentCount },
    { name: "Absent", value: stats.absentCount },
  ];
  const COLORS = ["#6b48a3", "#ff6b6b"];

  const departmentAbsenceMap = {};
  attendances
    .filter((a) => a.status === "Absent")
    .forEach((a) => {
      const dept =
        a.employee?.dept_name ||
        a.employee?.department?.dept_name ||
        a.dep_name ||
        "Unknown";
      departmentAbsenceMap[dept] = (departmentAbsenceMap[dept] || 0) + 1;
    });
  const mostAbsentDept = Object.entries(departmentAbsenceMap).reduce(
    (max, [name, count]) => (count > max.count ? { name, count } : max),
    { name: "N/A", count: 0 }
  );

  return (
    <div className="dash-page-wrapper">
      <ToastContainer />
      <header className="dash-header">
        <div className="dash-header-title">
          <PieChartFill className="dash-header-icon" />
          <h3>Dashboard</h3>
        </div>
      </header>

      <div className="dash-stats-section">
        {/* General Stats */}
        <div className="dash-stats-group">
          <h4 className="dash-stats-group-title">General</h4>
          <div className="dash-stats-container">
            <div className="dash-stat-card">
              <h4 className="dash-stat-label">
                <PersonFill className="dash-stat-icon" /> Total Employees
              </h4>
              <h3 className="dash-stat-value">{stats.totalEmployees}</h3>
            </div>
            <div className="dash-stat-card">
              <h4 className="dash-stat-label">
                <BuildingFill className="dash-stat-icon" /> Total Departments
              </h4>
              <h3 className="dash-stat-value">{stats.totalDepartments}</h3>
            </div>
            <div className="dash-stat-card">
              <h4 className="dash-stat-label">
                <CalendarFill className="dash-stat-icon" /> Total Holidays
              </h4>
              <h3 className="dash-stat-value">{stats.totalHolidays}</h3>
            </div>
          </div>
        </div>

        {/* Attendance Stats */}
        <div className="dash-stats-group">
          <h4 className="dash-stats-group-title">Attendance</h4>
          <div className="dash-stats-container">
            <div className="dash-stat-card">
              <h4 className="dash-stat-label">
                <ClockFill className="dash-stat-icon" /> Total Late Hours
              </h4>
              <h3 className="dash-stat-value">{stats.totalLateHours.toFixed(2)}h</h3>
            </div>
            <div className="dash-stat-card">
              <h4 className="dash-stat-label">
                <ClockFill className="dash-stat-icon" /> Total Overtime Hours
              </h4>
              <h3 className="dash-stat-value">{stats.totalOvertimeHours.toFixed(2)}h</h3>
            </div>
            <div className="dash-stat-card">
              <h4 className="dash-stat-label">
                <PersonFill className="dash-stat-icon" /> Best Employee (Late Hours)
              </h4>
              <h3 className="dash-stat-value">{bestEmployeeName}</h3>
            </div>
          </div>
        </div>

        {/* Payroll Stats */}
        <div className="dash-stats-group">
          <h4 className="dash-stats-group-title">Payroll</h4>
          <div className="dash-stats-container">
            <div className="dash-stat-card">
              <h4 className="dash-stat-label">
                <CurrencyDollar className="dash-stat-icon" /> Highest Salary
              </h4>
              <h3 className="dash-stat-value">${Number(stats.highestSalary).toFixed(2)}</h3>
            </div>
            <div className="dash-stat-card">
              <h4 className="dash-stat-label">
                <CurrencyDollar className="dash-stat-icon" /> Lowest Salary
              </h4>
              <h3 className="dash-stat-value">${Number(stats.lowestSalary).toFixed(2)}</h3>
            </div>
            <div className="dash-stat-card">
              <h4 className="dash-stat-label">
                <CurrencyDollar className="dash-stat-icon" /> Total Salaries
              </h4>
              <h3 className="dash-stat-value">${Number(stats.totalSalaries).toFixed(2)}</h3>
            </div>
            <div className="dash-stat-card">
              <h4 className="dash-stat-label">
                <CurrencyDollar className="dash-stat-icon" /> Total Net Salaries
              </h4>
              <h3 className="dash-stat-value">{Number(stats.totalNetSalaries).toLocaleString()} EGP</h3>
            </div>
            <div className="dash-stat-card">
              <h4 className="dash-stat-label">
                <CurrencyDollar className="dash-stat-icon" /> Average Salary
              </h4>
              <h3 className="dash-stat-value">{Number(stats.averageSalary).toLocaleString()} EGP</h3>
            </div>
          </div>
        </div>

        {/* Other Stats */}
        <div className="dash-stats-group">
          <h4 className="dash-stats-group-title">Other</h4>
          <div className="dash-stats-container">
            <div className="dash-stat-card">
              <h4 className="dash-stat-label">
                <BuildingFill className="dash-stat-icon" /> Largest Department
              </h4>
              <h3 className="dash-stat-value">
                {stats.largestDepartment.name} ({stats.largestDepartment.count})
              </h3>
            </div>
          </div>
        </div>

        {/* Optional: Add charts here like BarChart or PieChart with barData and pieData */}
      </div>
    </div>
  );
}

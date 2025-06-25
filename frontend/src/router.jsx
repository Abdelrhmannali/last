import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Holidayes from './pages/Holidayes/Holidayes';
import Login from './pages/Login/Login';
import Payroll from './pages/Payroll/Payroll';

import DepartmentsPage from "./pages/Departments/Departments";
import AddHrPage from './pages/Hr/AddHrPage';
import UpdateHrPage from './pages/Hr/UpdateHrPage';
import Employees from './pages/Employees/Employees';
import AddEmployee from './pages/Employees/AddEmployee';
import EditEmployee from './pages/Employees/EditEmployee';
import AttendancePage from './pages/Attendance/AttendancePage';
import GeneralSettingForm from './pages/Settings/GeneralSettingForm';


export default function RouterComponent() {
  return (
    <Routes>
      <Route element={<Sidebar />}>
        <Route path="/" element={<Holidayes />} />
        <Route path="/holidays" element={<Holidayes />} />
        <Route path="/payroll" element={<Payroll />} />
          <Route path='/Attendance' element={<AttendancePage />} />
        <Route path="/departments" element={<DepartmentsPage />} />
        <Route path="/addHr" element={<AddHrPage />} />
        <Route path="/updateHr" element={<UpdateHrPage />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/settings/general" element={<GeneralSettingForm />} />
        
        {/* Nested routes for employees */}
       <Route path="/employees/add" element={<AddEmployee />} />
        <Route path="/employees/edit/:id" element={<EditEmployee />} />
      </Route>

      
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}
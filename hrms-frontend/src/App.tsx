// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import EmployeePage from './pages/EmployeePage';
import LeavePage from './pages/LeavePage';
import UserLayout from './components/UserLayout';
import UserDashboard from './pages/user/UserDashboard';
import UserLeavePage from './pages/user/UserLeavePage';
import Layout from './components/Layout';
// Import other user pages as needed

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        
        {/* Admin Routes */}
        <Route element={<Layout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/employees" element={<EmployeePage />} />
          <Route path="/admin/leave" element={<LeavePage />} />
        </Route>

        {/* User Routes */}
        <Route element={<UserLayout />}>
          <Route path="/user/dashboard" element={<UserDashboard />} />
          <Route path="/user/leave" element={<UserLeavePage />} />
          {/* Add more user routes as needed */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
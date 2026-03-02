// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import EmployeePage from './pages/EmployeePage';
import LeavePage from './pages/LeavePage'; // Add this import
import Layout from './components/Layout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route element={<Layout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/employees" element={<EmployeePage />} />
          <Route path="/admin/leave" element={<LeavePage />} /> {/* Add this route */}
          {/* Add more admin pages later */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
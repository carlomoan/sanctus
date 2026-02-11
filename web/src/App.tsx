import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Parishes from './pages/Parishes';
import Members from './pages/Members';
import Finance from './pages/Finance';
import Budgets from './pages/Budgets';
import Reports from './pages/Reports';
import DataImport from './pages/DataImport';
import Sacraments from './pages/Sacraments';
import Users from './pages/Users';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="parishes" element={<Parishes />} />
              <Route path="members" element={<Members />} />
              <Route path="sacraments" element={<Sacraments />} />
              <Route path="finance" element={<Finance />} />
              <Route path="budgets" element={<Budgets />} />
              <Route path="reports" element={<Reports />} />
              <Route path="import" element={<DataImport />} />
              <Route path="users" element={<Users />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App

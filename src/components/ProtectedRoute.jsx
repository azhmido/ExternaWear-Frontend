import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

//bungkus halaman yang cuma boleh diakses user tertentu
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-linen">
      <div className="w-8 h-8 border-4 border-ink border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/" replace />;

  return children;
};

export default ProtectedRoute;
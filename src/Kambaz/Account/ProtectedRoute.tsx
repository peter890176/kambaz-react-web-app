import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export default function ProtectedRoute({ children, requiredRoles = [] }: ProtectedRouteProps) {
  const { currentUser } = useSelector((state: any) => state.accountReducer);
  
  // Check if user is authenticated
  if (!currentUser) {
    return <Navigate to="/Kambaz/Account/Signin" />;
  }
  
  // If no specific roles are required, allow access
  if (requiredRoles.length === 0) {
    return <>{children}</>;
  }
  
  // Check if user has one of the required roles
  const userRole = currentUser.role || '';
  if (requiredRoles.includes(userRole)) {
    return <>{children}</>;
  }
  
  // If user doesn't have the required role, redirect to dashboard
  return <Navigate to="/Kambaz/Dashboard" />;
}

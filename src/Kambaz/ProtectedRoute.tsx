import { useSelector } from "react-redux";
import { Navigate } from "react-router";

export const ProtectedRoute = ({ children }: { children: any }) => {
  const { currentUser } = useSelector((state: any) => state.accountReducer);
  if (!currentUser) {
    return <Navigate to="/Kambaz/Account/SignIn" />;
  }
  return children;
}; 
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
export default function AccountNavigation() {
  const { currentUser } = useSelector((state: any) => state.accountReducer);
  const { pathname } = useLocation();
  const active = (path: string) => (pathname.includes(path) ? "active" : "");
  
  return (
    <div id="wd-account-navigation">
      {!currentUser && (
        <>
          <Link to={`/Kambaz/Account/Signin`}> Signin </Link> <br/>
          <Link to={`/Kambaz/Account/Signup`}> Signup </Link> <br/>
        </>
      )}
      {currentUser && (
        <Link to={`/Kambaz/Account/Profile`} className={`nav-link ${active("Profile")}`}> Profile </Link>
      )}
      {currentUser && currentUser.role === "ADMIN" && (
       <Link to={`/Kambaz/Account/Users`} className={`list-group-item ${active("Users")}`}> Users </Link> )}
    </div>
  );
}

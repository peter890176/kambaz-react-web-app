import Signin from "./Signin";
import Profile from "./Profile";
import Signup from "./Signup";
import AccountNavigation from "./Navigation";
import { Routes, Route, Navigate } from "react-router";
import { useSelector } from "react-redux";
import Users from "./Users";
export default function Account() {
  const { currentUser } = useSelector((state: any) => state.accountReducer);
  return (
    <div id="wd-account-screen">
      <table>
        <tbody>
          <tr>
            <td valign="top">
              <AccountNavigation />
            </td>
            <td valign="top">
              <h2>Account</h2>
              <Routes>
                <Route path="/" element={<Navigate to={currentUser ? "/Kambaz/Account/Profile" : "/Kambaz/Account/Signin"} />} />
                <Route path="/Signin" element={<Signin />} />
                <Route path="/Profile" element={<Profile />} />
                <Route path="/Signup" element={<Signup />} />
                <Route path="/Users" element={<Users />} />
                <Route path="/Users/:uid" element={<Users />} />
              </Routes>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

import { Routes, Route, Navigate } from "react-router";
import { Link } from "react-router-dom";
import Account from "./Account";
import Dashboard from "./Dashboard";
import KambazNavigation from "./Navigation";
import Courses from "./Courses";
export default function Kambaz() {
  return (
    <div id="wd-kambaz">
            <KambazNavigation />
            <div className="wd-main-content-offset p-3" style={{ marginLeft: "120px" }}>
      <Link to="/" className="mb-3 d-inline-block">Landing page</Link>
      <Routes>
        <Route path="/" element={<Navigate to="Account" />} />
        <Route path="/Account/*" element={<Account />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/Courses/:cid/*" element={<Courses />} />
      </Routes>
    </div>
    </div>
  );
}

import { Link } from "react-router-dom";
import { AiOutlineDashboard } from "react-icons/ai";
import { IoCalendarOutline } from "react-icons/io5";
import { LiaBookSolid, LiaCogSolid } from "react-icons/lia";
import { FaInbox, FaRegCircleUser } from "react-icons/fa6";

export default function KambazNavigation() {
  return (
    <div id="wd-kambaz-navigation" style={{ width: 120 }} 
       className="list-group rounded-0 position-fixed
       bottom-0 top-0 d-none d-md-block bg-black z-2">
    <a id="wd-neu-link" target="_blank" 
       href="https://www.northeastern.edu/"
       className="list-group-item bg-black border-0 text-center">
       <img src="/images/MONOGRAM-red-2-1-1.svg" width="75px" /></a>
    <Link to="/Kambaz/Account" id="wd-account-link"
       className="list-group-item text-center border-0 bg-black text-white">
       <FaRegCircleUser className="fs-1 text text-white" />
       Account </Link><br />
    <Link to="/Kambaz/Dashboard" id="wd-dashboard-link"
       className="list-group-item text-center border-0
                  bg-white text-danger">
       <AiOutlineDashboard className="fs-1 text-danger" />
       Dashboard </Link><br />
    <Link to="/Kambaz/Dashboard" id="wd-course-link"
       className="list-group-item text-white
                  bg-black text-center border-0">
       <LiaBookSolid className="fs-1 text-danger" />
       Courses </Link><br />
       <Link to="/Kambaz/Calendar" id="wd-calendar-link"
       className="list-group-item text-white
                  bg-black text-center border-0">
       <IoCalendarOutline className="fs-1 text-danger" />
       Calendar </Link><br />
    <Link to="/Kambaz/Inbox" id="wd-inbox-link"
       className="list-group-item text-white
                  bg-black text-center border-0
                  d-flex flex-column align-items-center">
       <FaInbox className="fs-1 text-danger" />
       Inbox </Link><br />
    <Link to="/Kambaz/Settings" id="wd-settings-link"
       className="list-group-item text-white
                  bg-black text-center border-0">
       <LiaCogSolid className="fs-1 text-danger" />
       Settings </Link>
  </div>);}


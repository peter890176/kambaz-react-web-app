import { Link, useLocation } from "react-router-dom";
import { useParams } from "react-router";
{/*Revised by AI*/}
export default function CourseNavigation() {
  const { cid } = useParams();
  const { pathname } = useLocation();
  const links = ["Home", "Modules", "Piazza", "Zoom", "Assignments", "Quizzes", "Grades", "People"];
      
  return (
  <div id="wd-courses-navigation" className="wd list-group fs-5 rounded-0">
      {links.map((link) => (
        <div key={link}>
          <Link
            to={`/Kambaz/Courses/${cid}/${link}`}
            id={`wd-course-${link.toLowerCase()}-link`}
            className={`list-group-item border border-0 ${
              pathname.includes(`/${link}`) ? "active" : "text-danger"
            }`}
          >
            {link}
          </Link>
          <br />
        </div>
      ))}
    </div>
  );
}
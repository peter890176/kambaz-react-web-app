import { Link } from "react-router-dom";
export default function Dashboard() {
  return (
    <div id="wd-dashboard">
      <h1 id="wd-dashboard-title">Dashboard</h1> <hr />
      <h2 id="wd-dashboard-published">Published Courses (12)</h2> <hr />
      <div id="wd-dashboard-courses">
        <div className="wd-dashboard-course">
          <Link to="/Kambaz/Courses/1231/Home"
                className="wd-dashboard-course-link" >
            <img src="/images/cs01.jpeg" width={200} />
            <div>
              <h5> CS1231 React JS1 </h5>
              <p className="wd-dashboard-course-title">
                Full Stack software developer1  </p>
              <button> Go </button>
            </div>
          </Link>
        </div>
        <div className="wd-dashboard-course"> <Link to="/Kambaz/Courses/1232/Home"
                className="wd-dashboard-course-link" >
            <img src="/images/cs02.jpeg" width={200} />
            <div>
              <h5> CS1232 React JS2 </h5>
              <p className="wd-dashboard-course-title">
                Full Stack software developer2  </p>
              <button> Go </button>
            </div>
          </Link> </div>
        <div className="wd-dashboard-course"> <Link to="/Kambaz/Courses/1233/Home"
                className="wd-dashboard-course-link" >
            <img src="/images/cs03.jpeg" width={200} />
            <div>
              <h5> CS1233 React JS3 </h5>
              <p className="wd-dashboard-course-title">
                Full Stack software developer3  </p>
              <button> Go </button>
            </div>
          </Link> </div>
        <div className="wd-dashboard-course"> <Link to="/Kambaz/Courses/1234/Home"
                className="wd-dashboard-course-link" >
            <img src="/images/cs04.jpeg" width={200} />
            <div>
              <h5> CS1234 React JS4 </h5>
              <p className="wd-dashboard-course-title">
                Full Stack software developer4  </p>
              <button> Go </button>
            </div>
          </Link> </div>
        <div className="wd-dashboard-course"> <Link to="/Kambaz/Courses/1235/Home"
                className="wd-dashboard-course-link" >
            <img src="/images/cs05.jpeg" width={200} />
            <div>
              <h5> CS1235 React JS5 </h5>
              <p className="wd-dashboard-course-title">
                Full Stack software developer5  </p>
              <button> Go </button>
            </div>
          </Link> </div>
        <div className="wd-dashboard-course"> .<Link to="/Kambaz/Courses/1236/Home"
                className="wd-dashboard-course-link" >
            <img src="/images/cs06.jpeg" width={200} />
            <div>
              <h5> CS1236 React JS6 </h5>
              <p className="wd-dashboard-course-title">
                Full Stack software developer6  </p>
              <button> Go </button>
            </div>
          </Link> </div>
        <div className="wd-dashboard-course"> <Link to="/Kambaz/Courses/1237/Home"
                className="wd-dashboard-course-link" >
            <img src="/images/cs07.jpeg" width={200} />
            <div>
              <h5> CS1237 React JS7 </h5>
              <p className="wd-dashboard-course-title">
                Full Stack software developer7  </p>
              <button> Go </button>
            </div>
          </Link> </div>
      </div>
    </div>
);}

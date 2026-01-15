import { useNavigate } from "react-router-dom";

/* Student images */
import student1 from "./assets/students/student1.jpg";
import student2 from "./assets/students/student2.jpg";
import student3 from "./assets/students/student3.jpg";
import student4 from "./assets/students/student4.jpg";
import student5 from "./assets/students/student5.jpg";

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-root">
      {/* HEADER */}
      <header className="home-header">
        <div className="institution-brand">
          UNIVERSITY EXAMINATION MANAGEMENT SYSTEM
        </div>
      </header>

      {/* HERO COLLAGE */}
      <main className="hero-collage">
        {/* STUDENT IMAGES */}
        <img src={student1} className="collage-img img-1" alt="Student" />
        <img src={student2} className="collage-img img-2" alt="Student" />
        <img src={student3} className="collage-img img-3" alt="Student" />
        <img src={student4} className="collage-img img-4" alt="Student" />
        <img src={student5} className="collage-img img-5" alt="Student" />

        {/* CENTER CONTROL */}
        <div className="hero-center">
          <h1>Digital Examination Platform</h1>

          <p>
            Secure, scalable and institution-grade examination infrastructure
            for modern universities.
          </p>

          <div className="hero-actions">
            <button
              className="hero-btn student"
              onClick={() => navigate("/student")}
            >
              Student Portal
            </button>

            <button
              className="hero-btn teacher"
              onClick={() => navigate("/teacher")}
            >
              Faculty & Administration
            </button>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="home-footer">
        Designed for Universities, Boards, and Academic Institutions
      </footer>
    </div>
  );
}

export default HomePage;

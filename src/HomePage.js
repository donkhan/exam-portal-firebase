import { useNavigate } from "react-router-dom";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "./firebase";

/* Student images */
import student1 from "./assets/students/student1.jpg";
import student2 from "./assets/students/student2.jpg";
import student3 from "./assets/students/student3.jpg";
import student4 from "./assets/students/student4.jpg";
import student5 from "./assets/students/student5.jpg";

function HomePage() {
  const navigate = useNavigate();

  /* ================= LOGIN HANDLERS ================= */

  const studentLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      navigate("/student"); // student flow continues
    } catch (err) {
      console.error("Student login failed", err);
      alert("Login failed. Please try again.");
    }
  };

  const facultyLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      navigate("/teacher"); // teacher route is already guarded
    } catch (err) {
      console.error("Faculty login failed", err);
      alert("Login failed. Please try again.");
    }
  };

  return (
    <div className="home-root">
      {/* ================= HEADER ================= */}
      <header className="home-header">
        <div className="institution-brand">
          UNIVERSITY EXAMINATION MANAGEMENT SYSTEM
        </div>
      </header>

      {/* ================= HERO / COLLAGE ================= */}
      <main className="hero-collage">
        {/* STUDENT IMAGES */}
        <img src={student1} className="collage-img img-1" alt="Student" />
        <img src={student2} className="collage-img img-2" alt="Student" />
        <img src={student3} className="collage-img img-3" alt="Student" />
        <img src={student4} className="collage-img img-4" alt="Student" />
        <img src={student5} className="collage-img img-5" alt="Student" />

        {/* ================= CENTER CONTENT ================= */}
        <div className="hero-center">
          <h1>Digital Examination Platform</h1>

          <p>
            Secure, scalable and institution-grade examination infrastructure
            designed for modern universities and academic institutions.
          </p>

          {/* GENERAL INSTRUCTIONS */}
          <ul style={{ textAlign: "left", marginTop: 16, fontSize: 14 }}>
            <li>✔ Ensure stable internet connectivity</li>
            <li>✔ Do not refresh the browser during the exam</li>
            <li>✔ Login using your official Google account</li>
          </ul>

          <div className="hero-actions">
            {/* STUDENT */}
            <button
              className="hero-btn student"
              onClick={studentLogin}
            >
              Student Login
            </button>

            {/* FACULTY */}
            <button
              className="hero-btn teacher"
              onClick={facultyLogin}
            >
              Faculty & Administration
            </button>
          </div>
        </div>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="home-footer">
        Designed for Universities, Boards, and Academic Institutions
      </footer>
    </div>
  );
}

export default HomePage;

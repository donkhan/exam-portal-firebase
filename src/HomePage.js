import { useNavigate } from "react-router-dom";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "./firebase";

import student1 from "./assets/students/student1.jpg";
import student2 from "./assets/students/student2.jpg";
import student3 from "./assets/students/student3.jpg";
import student4 from "./assets/students/student4.jpg";
import student5 from "./assets/students/student5.jpg";

function HomePage() {
  const navigate = useNavigate();

  
  const studentLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      navigate("/student/exam-entry");
    } catch (err) {
      console.error("Student login failed", err);
      alert("Login failed. Please try again.");
    }
  };

  const facultyLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      navigate("/instructor");
    } catch (err) {
      console.error("Faculty login failed", err);
      alert("Login failed. Please try again.");
    }
  };

  const toggleTheme = () => {
  const current =
    document.documentElement.getAttribute("data-theme");

  const next =
    current === "neo-dark" ? "campus-light" : "neo-dark";

  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("examverse-theme", next);
};


  return (
    <div className="home-root">
      {/* ================= HEADER ================= */}
      <header className="home-header">
        <div className="institution-brand">
          ExamVerse
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
          <h1>Exams, Reimagined.</h1>

          <p>
            A next-generation examination platform built for speed, security,
            and real academic evaluation — not just submissions.
          </p>

          {/* GENERAL INSTRUCTIONS */}
          <ul style={{ textAlign: "left", marginTop: 16, fontSize: 14 }}>
            <li>✔ Use a stable internet connection</li>
            <li>✔ Avoid refreshing or switching tabs during the exam</li>
            <li>✔ Sign in using your official Google account</li>
          </ul>

          <div className="hero-actions">
            {/* STUDENT */}
            <button
              className="hero-btn student"
              onClick={studentLogin}
            >
              Enter as Student
            </button>

            {/* FACULTY */}
            <button
              className="hero-btn teacher"
              onClick={facultyLogin}
            >
              Faculty & Admin Portal
            </button>
          </div>
        </div>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="home-footer">
        Powering modern assessments for campuses, boards, and digital-first institutions.
      </footer>
    
      <button
  className="theme-fab"
  onClick={toggleTheme}
  title="Switch theme"
>
  🌓
</button>
    </div>
    
  );
}

export default HomePage;

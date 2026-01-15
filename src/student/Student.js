import { useEffect, useState } from "react";
import {
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../firebase";
import examHall from "../assets/examhall.jpg";
import { useNavigate } from "react-router-dom";

function Student() {
  const [user, setUser] = useState(null);

  /* ================= AUTH STATE ================= */
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
  }, []);

  /* ================= LOGIN ================= */
  const login = async () => {
    await signInWithPopup(auth, new GoogleAuthProvider());
  };


const navigate = useNavigate();

useEffect(() => {
  if (user) {
    navigate("/student/exam-entry");
  }
}, [user, navigate]);

  /* ================= BEFORE LOGIN ================= */
  return (
    <div className="student-entry-root">
      {/* Background */}
      <div
        className="student-bg"
        style={{
          backgroundImage: `url(${examHall})`,
        }}
      />

      {/* Overlay */}
      <div className="student-overlay" />

      {/* Login Card */}
      <div className="student-entry-card">
        <h2>Student Examination Portal</h2>

        <p className="student-subtitle">
          Please login using your registered Google account
        </p>

        <button className="student-login-btn" onClick={login}>
          Login with Google
        </button>

        <ul className="student-rules">
          <li>✔ Ensure a stable internet connection</li>
          <li>✔ Do not refresh the browser during the exam</li>
          <li>✔ Your answers are saved automatically</li>
        </ul>
      </div>
    </div>
  );
}

export default Student;

import { signOut } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";

import { auth } from "./../firebase";
import { useTheme } from "../ThemeContext";

import "../instructor/instructor.css";

function InstructorApp() {
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();

  const logout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div className="instructor-container">
      {/* ===== HEADER ===== */}
      <div className="instructor-header">
        <h2>Instructor Portal</h2>

        <button className="secondary" onClick={logout}>
          Logout
        </button>
      </div>

      <hr />

      {/* ===== DASHBOARD ACTIONS ===== */}
      <h3>Actions</h3>

      <div className="instructor-card-grid">
        <Link to="/instructor/manage-courses" className="instructor-card-link">
          <button>
            <span className="card-icon">📘</span>
            <span className="card-text">Manage Courses</span>
          </button>
        </Link>

        <Link to="/instructor/exams" className="instructor-card-link">
          <button>
            <span className="card-icon">🧪</span>
            <span className="card-text">Exam Management</span>
          </button>
        </Link>
      </div>

      {/* ===== THEME TOGGLE (FAB) ===== */}
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

export default InstructorApp;

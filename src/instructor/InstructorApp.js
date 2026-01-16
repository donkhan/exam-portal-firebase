import { useState } from "react";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

import { auth } from "./../firebase";
import { useTheme } from "../ThemeContext";

import ExamResults from "./ExamResults";
import ManageCourses from "./ManageCourses";
import ExamManagement from "./ExamManagement";

import "./instructor.css";

function InstructorApp() {
  const [view, setView] = useState("home");
  const [selectedExamId, setSelectedExamId] = useState(null);

  const navigate = useNavigate();
  const { toggleTheme } = useTheme();

  const logout = async () => {
    await signOut(auth);
    navigate("/"); // back to HomePage
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

      {/* ---------- HOME MENU ---------- */}
      {view === "home" && (
        <>
          <h3>Actions</h3>

          <div className="instructor-card-grid">
            <button onClick={() => setView("manageCourses")}>
              <span className="card-icon">📘</span>
              <span className="card-text">Manage Courses</span>
            </button>

            <button onClick={() => setView("examManagement")}>
              <span className="card-icon">🧪</span>
              <span className="card-text">Exam Management</span>
            </button>
          </div>
        </>
      )}

      {/* ---------- EXAM MANAGEMENT ---------- */}
      {view === "examManagement" && (
        <ExamManagement
          onBack={() => setView("home")}
          onViewResults={(examId) => {
            setSelectedExamId(examId);
            setView("examResults");
          }}
        />
      )}

      {/* ---------- EXAM RESULTS ---------- */}
      {view === "examResults" && (
        <ExamResults
          examId={selectedExamId}
          onBack={() => setView("examManagement")}
        />
      )}

      {/* ---------- MANAGE COURSES ---------- */}
      {view === "manageCourses" && (
        <ManageCourses onBack={() => setView("home")} />
      )}

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

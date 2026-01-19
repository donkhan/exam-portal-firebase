import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

import { ThemeProvider } from "./ThemeContext";
import "./themes.css";

import SanitizeQuestions from "./instructor/SanitizeQuestions";

/* ===== COMMON ===== */
import HomePage from "./HomePage";

/* ===== STUDENT FLOW ===== */
import ExamEntry from "./student/ExamEntry";
import ExamApplication from "./student/ExamApplication";

/* ===== INSTRUCTOR FLOW ===== */
import InstructorApp from "./instructor/InstructorApp";
import ExamResults from "./instructor/ExamResults";
import ManageCourses from "./instructor/ManageCourses";
import { isInstructor } from "./utils/isInstructor";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ===== AUTH STATE ===== */
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) return <p>Loading...</p>;

  const instructor = isInstructor(user);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* ================= HOME ================= */}
          <Route path="/" element={<HomePage />} />

          {/* ================= STUDENT ================= */}
          <Route path="/student/exam-entry" element={<ExamEntry />} />
          <Route path="/student/exam/:examId" element={<ExamApplication />} />

          {/* ================= INSTRUCTOR ================= */}
          <Route
            path="/instructor"
            element={
              instructor ? <InstructorApp /> : <Navigate to="/" replace />
            }
          />
          <Route path="/exam/:examId" element={<ExamApplication />} />

          <Route
            path="/instructor/results"
            element={instructor ? <ExamResults /> : <Navigate to="/" replace />}
          />

          <Route
            path="/instructor/manage-courses"
            element={
              instructor ? <ManageCourses /> : <Navigate to="/" replace />
            }
          />

          <Route
            path="/sanitize"
            element={
              instructor ? <SanitizeQuestions /> : <Navigate to="/" replace />
            }
          />

          {/* ================= FALLBACK ================= */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;

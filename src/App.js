import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

/* ===== COMMON ===== */
import HomePage from "./HomePage";

/* ===== STUDENT FLOW ===== */
import Student from "./student/Student";
import ExamEntry from "./student/ExamEntry";
import ExamApplication from "./student/ExamApplication";

/* ===== TEACHER FLOW ===== */
import TeacherLogin from "./teacher/TeacherLogin";
import TeacherApp from "./teacher/TeacherApp";
import ExamResults from "./teacher/ExamResults";
import ManageCourses from "./teacher/ManageCourses";

const TEACHER_EMAIL = "kamil.k@cmr.edu.in";

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

  return (
    <BrowserRouter>
      <Routes>
        {/* ================= HOME ================= */}
        <Route path="/" element={<HomePage />} />

        {/* ================= STUDENT FLOW ================= */}
        <Route path="/student" element={<Student />} />
        <Route path="/student/exam-entry" element={<ExamEntry />} />
        <Route path="/student/exam/:examId" element={<ExamApplication />} />

        {/* ================= TEACHER FLOW ================= */}
        <Route path="/teacher-login" element={<TeacherLogin />} />

        <Route
          path="/teacher"
          element={
            user?.email === TEACHER_EMAIL ? (
              <TeacherApp />
            ) : (
              <Navigate to="/teacher-login" replace />
            )
          }
        />

        <Route
          path="/teacher/results"
          element={
            user?.email === TEACHER_EMAIL ? (
              <ExamResults />
            ) : (
              <Navigate to="/teacher-login" replace />
            )
          }
        />

        <Route
          path="/teacher/manage-courses"
          element={
            user?.email === TEACHER_EMAIL ? (
              <ManageCourses />
            ) : (
              <Navigate to="/teacher-login" replace />
            )
          }
        />

        {/* ================= FALLBACK ================= */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

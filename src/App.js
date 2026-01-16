import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

import "./themes.css";

import HomePage from "./HomePage";

import ExamEntry from "./student/ExamEntry";
import ExamApplication from "./student/ExamApplication";

import ExamResults from "./instructor/ExamResults";
import ManageCourses from "./instructor/ManageCourses";
import InstructorApp  from "./instructor/InstructorApp";

const INSTRUCTOR_EMAIL = "kamil.k@cmr.edu.in";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const savedTheme =
      localStorage.getItem("examverse-theme") || "neo-dark";

    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  if (loading) return <p>Loading...</p>;

  const isInstructor = user?.email === INSTRUCTOR_EMAIL;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route path="/student/exam-entry" element={<ExamEntry />} />
        <Route path="/student/exam/:examId" element={<ExamApplication />} />

        <Route
          path="/instructor"
          element={isInstructor ? <InstructorApp /> : <Navigate to="/" replace />}
        />

        <Route
          path="/instructor/results"
          element={isInstructor ? <ExamResults /> : <Navigate to="/" replace />}
        />

        <Route
          path="/instructor/manage-courses"
          element={isInstructor ? <ManageCourses /> : <Navigate to="/" replace />}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

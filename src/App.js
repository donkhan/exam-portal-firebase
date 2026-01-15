import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Student from "./student/Student";
import TeacherApp from "./teacher/TeacherApp";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import ExamResults from "./teacher/ExamResults";
import ManageCourses from "./teacher/ManageCourses";
import HomePage from "./HomePage";

const TEACHER_EMAIL = "kamil.k@cmr.edu.in";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
        {/* 🌟 Flashy common landing page */}
        <Route path="/" element={<HomePage />} />

        {/* 🎓 Student portal */}
        <Route path="/student" element={<Student />} />

        {/* 🧑‍🏫 Teacher portal (protected) */}
        <Route
          path="/teacher"
          element={
            user?.email === TEACHER_EMAIL ? (
              <TeacherApp />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route
          path="/teacher/results"
          element={
            user?.email === TEACHER_EMAIL ? (
              <ExamResults />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route
          path="/teacher/manage-courses"
          element={
            user?.email === TEACHER_EMAIL ? (
              <ManageCourses />
            ) : (
              <Navigate to="/" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

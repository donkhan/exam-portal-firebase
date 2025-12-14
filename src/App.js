import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Student from "./Student";
import TeacherApp from "./TeacherApp";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import TeacherResults from "./TeacherResults";


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
        <Route
          path="/"
          element={
            user?.email === TEACHER_EMAIL
              ? <Navigate to="/teacher" />
              : <Navigate to="/student" />
          }
        />
        <Route path="/student" element={<Student />} />
        <Route path="/teacher" element={<TeacherApp />} />
        <Route path="/teacher/results" element={<TeacherResults />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;

import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { auth } from "./firebase";
import QuestionBank from "./QuestionBank";
import CreateExam from "./CreateExam";
import TeacherResults from "./TeacherResults"; // ✅ add this
import "./App.css";

const TEACHER_EMAIL = "kamil.k@cmr.edu.in";

function TeacherApp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("home");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setView("home");
  };

  /* ---------- LOADING ---------- */
  if (loading) {
    return <p>Loading...</p>;
  }

  /* ---------- LOGIN ---------- */
  if (!user) {
    return (
      <div className="login-wrapper">
        <div className="app-container" style={{ maxWidth: "420px" }}>
          <h2>Teacher Portal</h2>
          <button onClick={login}>Login with Google</button>
        </div>
      </div>
    );
  }

  /* ---------- ACCESS DENIED ---------- */
  if (user.email !== TEACHER_EMAIL) {
    return (
      <div className="login-wrapper">
        <div className="app-container" style={{ maxWidth: "420px" }}>
          <h2>Teacher Portal</h2>
          <p className="error">Access denied. Teacher only.</p>
          <button onClick={logout}>Logout</button>
        </div>
      </div>
    );
  }

  /* ---------- AUTHORIZED TEACHER ---------- */
  return (
    <div className="app-container">
      <h2 align="center">CMR University</h2>
      <h2>Teacher Portal</h2>

      <p>
        <strong>{user.displayName}</strong>
        <br />
        {user.email}
      </p>

      <button onClick={logout}>Logout</button>

      <hr />

      <p className="success">✅ Teacher authentication successful</p>

      <hr />

      {/* ---------- HOME MENU ---------- */}
      {view === "home" && (
        <>
          <h3>Teacher Actions</h3>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button onClick={() => setView("questionBank")}>
              Question Bank
            </button>

            <button onClick={() => setView("createExam")}>Create Exam</button>

            <button onClick={() => setView("results")}>View Results</button>
          </div>
        </>
      )}

      {/* ---------- QUESTION BANK ---------- */}
      {view === "questionBank" && (
        <QuestionBank onBack={() => setView("home")} />
      )}

      {/* ---------- CREATE EXAM ---------- */}
      {view === "createExam" && <CreateExam onBack={() => setView("home")} />}

      {/* ---------- RESULTS ---------- */}
      {view === "results" && <TeacherResults onBack={() => setView("home")} />}
    </div>
  );
}

export default TeacherApp;

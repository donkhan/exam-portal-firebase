import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import { auth } from "./firebase";
import QuestionBank from "./QuestionBank";
import CreateExam from "./CreateExam";
import { useNavigate } from "react-router-dom";


const TEACHER_EMAIL = "kamil.k@cmr.edu.in";

function TeacherApp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("home");
  const navigate = useNavigate();

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
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>Teacher Portal</h2>
        <button onClick={login}>Login with Google</button>
      </div>
    );
  }

  if (user.email !== TEACHER_EMAIL) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>Teacher Portal</h2>
        <p style={{ color: "red" }}>Access denied. Teacher only.</p>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Teacher Portal</h2>

      <p>
        <strong>{user.displayName}</strong><br />
        {user.email}
      </p>

      <button onClick={logout}>Logout</button>

      <hr />

     

      <p style={{ color: "green", fontWeight: "bold" }}>
  ✅ Teacher authentication successful
</p>

<hr />

{view === "home" && (
  <>
    <h3>Teacher Actions</h3>

    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
      <button onClick={() => setView("questionBank")}>
        Question Bank
      </button>

      <button onClick={() => setView("createExam")}>
          Create Exam
      </button>

      <button
  onClick={() => navigate("/teacher/results")}
  style={{ marginLeft: "10px" }}
>
  View Results
</button>


    </div>

    <p style={{ marginTop: "10px", fontStyle: "italic", color: "#555" }}>
      (Other actions will be enabled step by step)
    </p>
  </>
)}

{view === "questionBank" && (
  <QuestionBank onBack={() => setView("home")} />
)}

{view === "createExam" && (
  <CreateExam onBack={() => setView("home")} />
)}


<p style={{ marginTop: "10px", fontStyle: "italic", color: "#555" }}>
  (Actions will be enabled step by step)
</p>



    </div>
  );
}

export default TeacherApp;

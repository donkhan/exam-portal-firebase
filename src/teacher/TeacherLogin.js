import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";

const TEACHER_EMAIL = "kamil.k@cmr.edu.in";

function TeacherLogin() {
  const navigate = useNavigate();

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (u?.email === TEACHER_EMAIL) {
        navigate("/teacher", { replace: true });
      }
    });
  }, [navigate]);

  const login = async () => {
    await signInWithPopup(auth, new GoogleAuthProvider());
  };

  return (
    <div className="teacher-login-root">
      <h2>Faculty Portal</h2>

      <p>
        Authorized faculty members may sign in using their
        official university email ID.
      </p>

      <button onClick={login}>
        Sign in with University Google Account
      </button>

      <p style={{ marginTop: 12, fontSize: 13, color: "#666" }}>
        Unauthorized access is prohibited.
      </p>
    </div>
  );
}

export default TeacherLogin;

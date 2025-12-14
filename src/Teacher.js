import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import { auth } from "./firebase";

const TEACHER_EMAIL = "kamil.k@cmr.edu.in";

function Teacher() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
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

      <p>✅ Teacher authentication successful.</p>
    </div>
  );
}

export default Teacher;

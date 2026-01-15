import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import examEntryBg from "../assets/exam-entry-bg.jpg";

function ExamEntry() {
  const navigate = useNavigate();

  /* ================= AUTH ================= */
  const [user, setUser] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (!u) {
        navigate("/student"); // safety redirect
      } else {
        setUser(u);
      }
    });
  }, [navigate]);

  /* ================= STATE ================= */
  const [examId, setExamId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= VALIDATION ================= */
  const validateExam = async () => {
    if (!examId.trim()) {
      setError("Please enter Examination ID");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const snap = await getDocs(
        query(
          collection(db, "exams_meta"),
          where("exam_id", "==", examId.trim())
        )
      );

      if (snap.empty) {
        setError("Invalid Examination ID");
        setLoading(false);
        return;
      }

      const examMeta = snap.docs[0].data();

      if (!examMeta.active) {
        setError("This examination is not active");
        setLoading(false);
        return;
      }
      // ✅ Valid → store exam id & move to exam runtime
      localStorage.setItem("activeExamId", examId.trim());

      // ✅ Valid → move to exam runtime
      navigate(`/student/exam/${examId.trim()}`);
    } catch (e) {
      setError("Unable to verify exam. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  /* ================= UI ================= */

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: `url(${examEntryBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {/* Dark overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0, 0, 0, 0.45)",
        }}
      />

      {/* Card */}
      <div
        style={{
          width: 420,
          background: "#ffffff",
          padding: "34px 38px",
          borderRadius: 16,
          boxShadow: "0 25px 70px rgba(0,0,0,0.35)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <h2 style={{ marginBottom: 6 }}>
          Welcome, {user.displayName}
        </h2>

        <p style={{ color: "#555", marginBottom: 22 }}>
          {user.email}
        </p>

        <label style={{ fontWeight: 600, fontSize: 14 }}>
          Examination ID
        </label>

        <input
          value={examId}
          onChange={(e) => setExamId(e.target.value)}
          placeholder="Enter Examination ID"
          style={{
            width: "100%",
            padding: 12,
            marginTop: 8,
            marginBottom: 14,
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            fontSize: 15,
            textAlign: "center",
            letterSpacing: 1,
          }}
        />

        {error && (
          <p
            style={{
              color: "#dc2626",
              fontSize: 14,
              marginBottom: 12,
            }}
          >
            {error}
          </p>
        )}

        <button
          onClick={validateExam}
          disabled={loading}
          style={{
            width: "100%",
            padding: 12,
            background: "#2563eb",
            color: "#ffffff",
            border: "none",
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Checking Examination..." : "Proceed to Examination"}
        </button>
      </div>
    </div>
  );
}

export default ExamEntry;

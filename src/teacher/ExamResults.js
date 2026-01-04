import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./../firebase";
import { getAuth } from "firebase/auth";
import StudentAttemptDetails from "./StudentAttemptDetails";

const TEACHER_EMAIL = "kamil.k@cmr.edu.in";

export default function ExamResults({ examId, onBack }) {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttempt, setSelectedAttempt] = useState(null);

  const auth = getAuth();
  const user = auth.currentUser;

  /* ---------- LOAD RESULTS FOR ONE EXAM ---------- */
  const loadResults = async () => {
    if (!examId) {
      setAttempts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const q = query(
        collection(db, "exams"),
        where("exam_id", "==", examId)
      );

      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setAttempts(data);
    } catch (err) {
      console.error("Failed to load results:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
  }, [examId]);

  /* ---------- ACCESS CONTROL ---------- */
  if (!user || user.email !== TEACHER_EMAIL) {
    return <h3>Access Denied</h3>;
  }

  if (!examId) {
    return (
      <div style={{ padding: 20 }}>
        <h3>Exam Results</h3>
        {onBack && <button onClick={onBack}>← Back</button>}
        <hr />
        <p style={{ color: "red" }}>
          No exam selected. Please open results from Exam Management.
        </p>
      </div>
    );
  }

  /* ---------- UI ---------- */
  return (
    <div style={{ padding: 20 }}>
      <h3>Exam Results</h3>

      <p>
        <strong>Exam ID:</strong> {examId}
      </p>

      {onBack && <button onClick={onBack}>← Back</button>}

      <hr />

      {loading && <p>Loading results...</p>}

      {!loading && attempts.length === 0 && (
        <p>No attempts found for this exam.</p>
      )}

      {!loading && !selectedAttempt && attempts.length > 0 && (
        <table
          border="1"
          cellPadding="8"
          style={{ borderCollapse: "collapse", width: "100%" }}
        >
          <thead style={{ background: "#f0f0f0" }}>
            <tr>
              <th>#</th>
              <th>Student</th>
              <th>Score</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((a, index) => (
              <tr key={a.id}>
                <td>{index + 1}</td>
                <td>
                  <strong>{a.user_name || "—"}</strong>
                  <br />
                  <small style={{ color: "#666" }}>
                    {a.user_email}
                  </small>
                </td>
                <td>{a.score ?? "-"}</td>
                <td>{a.submitted ? "Submitted" : "In Progress"}</td>
                <td>
                  <button onClick={() => setSelectedAttempt(a)}>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selectedAttempt && (
        <StudentAttemptDetails
          attempt={selectedAttempt}
          onBack={async () => {
            await loadResults();       // 🔥 REFRESH after delete
            setSelectedAttempt(null);  // back to list
          }}
        />
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { getAuth } from "firebase/auth";
import StudentAttemptView from "./StudentAttemptView";
import { useNavigate } from "react-router-dom";


export default function TeacherResults() {
  const [examId, setExamId] = useState("");
  const [attempts, setAttempts] = useState([]);
  const [selectedAttempt, setSelectedAttempt] = useState(null);

  const auth = getAuth();
  const user = auth.currentUser;

  const navigate = useNavigate();

  

  if (!user || user.email !== "kamil.k@cmr.edu.in") {
    return <h3>Access Denied</h3>;
  }

  const loadResults = async () => {
    const q = query(
      collection(db, "exams"),
      where("exam_id", "==", examId)
    );

    const snap = await getDocs(q);
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setAttempts(data);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Teacher Results Dashboard</h2>
      <button
  onClick={() => navigate("/teacher")}
  style={{ marginBottom: "15px" }}
>
  ← Back to Teacher Dashboard
</button>
      <hr />

      <input
        placeholder="Enter Exam ID"
        value={examId}
        onChange={e => setExamId(e.target.value)}
      />
         <hr />
      
      <button onClick={loadResults}>Load Results</button>

      <hr />

      {!selectedAttempt && (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Student</th>
              <th>Score</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map(a => (
              <tr key={a.id}>
                <td>
                    <strong>{a.user_name || "—"}</strong>
                    <br />
                    <small style={{ color: "#666" }}>{a.user_email}</small>
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
        <StudentAttemptView
          attempt={selectedAttempt}
          onBack={() => setSelectedAttempt(null)}
        />
      )}
    </div>
  );
}

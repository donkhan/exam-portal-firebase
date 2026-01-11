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

  const [sortConfig, setSortConfig] = useState({
    key: null, // "email" | "score"
    direction: "asc", // "asc" | "desc"
  });

  const sortedAttempts = [...attempts].sort((a, b) => {
    if (!sortConfig.key) return 0;

    let valA, valB;

    if (sortConfig.key === "email") {
      valA = (a.user_email || "").toLowerCase();
      valB = (b.user_email || "").toLowerCase();
    }

    if (sortConfig.key === "score") {
      valA = a.score ?? -Infinity;
      valB = b.score ?? -Infinity;
    }

    if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
    if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

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
      const q = query(collection(db, "exams"), where("exam_id", "==", examId));

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

  const exportToCSV = () => {
  if (!attempts.length) {
    alert("No data to export");
    return;
  }

  const metaRow = [`Exam ID`, examId];

  const headers = [
    "Student Name",
    "Email",
    "Score",
    "Status",
  ];

  const rows = sortedAttempts.map((a) => [
    `"${a.user_name || ""}"`,
    `"${a.user_email || ""}"`,
    a.score ?? "",
    a.submitted ? "Submitted" : "In Progress",
  ]);

  const csvContent = [
    metaRow.join(","),
    "", // empty line
    headers.join(","),
    ...rows.map((r) => r.join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `exam_results_${examId}.csv`;
  link.click();

  URL.revokeObjectURL(url);
};

  /* ---------- UI ---------- */
  return (
    <div style={{ padding: 20 }}>
      <h3>Exam Results</h3>

      <p>
        <strong>Exam ID:</strong> {examId}
      </p>

      <div style={{ marginBottom: 10 }}>
        {onBack && <button onClick={onBack}>← Back</button>}
        <button style={{ marginLeft: 10 }} onClick={exportToCSV}>
          ⬇ Export CSV
        </button>
      </div>

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

              <th
                style={{ cursor: "pointer" }}
                onClick={() => handleSort("email")}
              >
                Student{" "}
                {sortConfig.key === "email" &&
                  (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>

              <th
                style={{ cursor: "pointer" }}
                onClick={() => handleSort("score")}
              >
                Score{" "}
                {sortConfig.key === "score" &&
                  (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>

              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {sortedAttempts.map((a, index) => (
              <tr key={a.id}>
                <td>{index + 1}</td>
                <td>
                  <strong>{a.user_name || "—"}</strong>
                  <br />
                  <small style={{ color: "#666" }}>{a.user_email}</small>
                </td>
                <td>{a.score ?? "-"}</td>
                <td>{a.submitted ? "Submitted" : "In Progress"}</td>
                <td>
                  <button onClick={() => setSelectedAttempt(a)}>View</button>
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
            await loadResults(); // 🔥 REFRESH after delete
            setSelectedAttempt(null); // back to list
          }}
        />
      )}
    </div>
  );
}

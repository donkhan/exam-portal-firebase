import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./../firebase";
import { getAuth } from "firebase/auth";
import StudentAttemptDetails from "./StudentAttemptDetails";
import { renderDevice } from "../utils/device";
import { getFunctions, httpsCallable } from "firebase/functions";

const TEACHER_EMAIL = "kamil.k@cmr.edu.in";

export default function ExamResults({ examId, onBack }) {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttempt, setSelectedAttempt] = useState(null);

  const inProgressAttempts = attempts.filter((a) => !a.submitted);
  const [closing, setClosing] = useState(false);

  const handleCloseAndEvaluate = async () => {
    if (inProgressAttempts.length === 0) {
      alert("No in-progress attempts to close.");
      return;
    }

    const ok = window.confirm(
      `This will force-submit and evaluate ${inProgressAttempts.length} in-progress attempt(s).\n\nThis action cannot be undone.\n\nProceed?`,
    );

    if (!ok) return;

    try {
      setClosing(true);

      const functions = getFunctions();
      const closeExam = httpsCallable(functions, "closeExamAndEvaluate");

      console.log("🔥 Calling closeExamAndEvaluate for exam:", examId);

      const res = await closeExam({ examId });

      console.log("✅ closeExamAndEvaluate response:", res.data);

      alert(`Exam closed. ${res.data.closed} attempt(s) submitted.`);

      await loadResults(); // refresh table
    } catch (err) {
      console.error("❌ Failed to close exam:", err);
      alert("Failed to close exam. Check console logs.");
    } finally {
      setClosing(false);
    }
  };

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

  const handleRefresh = async () => {
    setLoading(true);
    await loadResults();
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

    const headers = ["Student Name", "Email", "Score", "Status"];

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

  const formatDateTime = (ts) => {
    if (!ts) return "—";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleString();
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const toJsDate = (ts) => {
    if (!ts) return null;
    if (ts.toDate) return ts.toDate(); // Firestore Timestamp
    return new Date(ts); // ISO string / Date fallback
  };

  const renderFeedbackSummary = (feedback) => {
  if (!feedback) return "Skipped";

  const parts = [];

  if (feedback.rating != null) {
    parts.push(`⭐ ${feedback.rating}/5`);
  }

  if (feedback.difficulty) {
    parts.push(`📘 ${feedback.difficulty}`);
  }

  if (feedback.clarity != null) {
    parts.push(`🔍 ${feedback.clarity}/5`);
  }

  const header = parts.join(" | ");

  let comment = "";
  if (feedback.comments) {
    comment =
      feedback.comments.length > 80
        ? feedback.comments.slice(0, 80) + "…"
        : feedback.comments;
  }

  return (
    <>
      <div>{header || "—"}</div>
      {comment && (
        <div style={{ fontSize: "12px", color: "#555" }}>
          “{comment}”
        </div>
      )}
    </>
  );
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
        <button
          style={{ marginLeft: 10 }}
          onClick={handleRefresh}
          disabled={loading}
        >
          🔄 Refresh
        </button>
        <button
          style={{
            marginLeft: 10,
            backgroundColor: "#c62828",
            color: "white",
            padding: "6px 12px",
            border: "none",
            cursor: inProgressAttempts.length === 0 ? "not-allowed" : "pointer",
            opacity: inProgressAttempts.length === 0 ? 0.5 : 1,
          }}
          disabled={inProgressAttempts.length === 0 || closing}
          onClick={handleCloseAndEvaluate}
        >
          {closing
            ? "Closing Exam..."
            : `Close Exam & Evaluate (${inProgressAttempts.length})`}
        </button>

        {inProgressAttempts.length > 0 && (
          <p style={{ color: "#c62828", marginTop: 8 }}>
            ⚠ {inProgressAttempts.length} attempt(s) are still in progress. You
            may force-submit them.
          </p>
        )}
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
              <th>Feedback</th>
              <th>Status</th>

              <th>Start Time</th>
              <th>End Time</th>
              <th>Duration</th>
              <th>Device</th>

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
                <td style={{ maxWidth: 250 }}>
                  {renderFeedbackSummary(a.feedback)}
                </td>
                <td>{a.submitted ? "Submitted" : "In Progress"}</td>
                <td>{formatDateTime(a.started_at)}</td>

                <td>
                  {a.submitted ? (
                    formatDateTime(a.submitted_at)
                  ) : (
                    <span style={{ color: "orange" }}>Not submitted</span>
                  )}
                </td>

                <td>
                  {a.total_time_sec
                    ? formatDuration(a.total_time_sec)
                    : (() => {
                        const start = toJsDate(a.started_at);
                        const end = toJsDate(a.submitted_at);
                        return start && end
                          ? formatDuration(Math.floor((end - start) / 1000))
                          : "—";
                      })()}
                </td>
                <td>{renderDevice(a.device_type)}</td>
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

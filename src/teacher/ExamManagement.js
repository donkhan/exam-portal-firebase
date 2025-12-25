import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "./../firebase";
import CreateExam from "./CreateExam";

function ExamManagement({ onBack, onViewResults }) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("list"); // list | create

  /* ================= LOAD EXAMS ================= */

  const loadExams = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "exams_meta"));
      const list = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setExams(list);
    } catch (err) {
      console.error("Failed to load exams:", err);
      alert("Failed to load exams");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  /* ================= HARD DELETE (SINGLE EXAM) ================= */

  const deleteExam = async (examDocId, examId) => {
    const confirm1 = window.confirm(
      `Are you sure you want to DELETE exam "${examId}"?\n\nThis will permanently delete the exam AND all student results.`
    );
    if (!confirm1) return;

    const confirm2 = window.prompt(
      `Type DELETE to permanently delete exam "${examId}" and ALL its results`
    );
    if (confirm2 !== "DELETE") {
      alert("Deletion cancelled");
      return;
    }

    try {
      /* delete attempts */
      const attemptsQuery = query(
        collection(db, "exams"),
        where("exam_id", "==", examId)
      );
      const attemptsSnap = await getDocs(attemptsQuery);

      let deletedAttempts = 0;
      for (const d of attemptsSnap.docs) {
        await deleteDoc(doc(db, "exams", d.id));
        deletedAttempts++;
      }

      /* delete exam meta */
      await deleteDoc(doc(db, "exams_meta", examDocId));

      setExams((prev) => prev.filter((e) => e.id !== examDocId));

      alert(
        `Exam "${examId}" deleted successfully.\nDeleted ${deletedAttempts} result(s).`
      );
    } catch (err) {
      console.error("Failed to delete exam and results:", err);
      alert("Deletion failed. Check console.");
    }
  };

  /* ================= ADMIN: DELETE ALL ================= */

  const deleteAllExams = async () => {
    const confirm1 = window.confirm(
      "⚠️ ADMIN ACTION ⚠️\n\nThis will DELETE ALL exams AND ALL student results.\n\nThis action is IRREVERSIBLE."
    );
    if (!confirm1) return;

    const confirm2 = window.prompt(
      'Type "DELETE ALL" to permanently remove ALL exams and results'
    );
    if (confirm2 !== "DELETE ALL") {
      alert("Operation cancelled");
      return;
    }

    try {
      const examsSnap = await getDocs(collection(db, "exams"));
      let deletedAttempts = 0;
      for (const d of examsSnap.docs) {
        await deleteDoc(doc(db, "exams", d.id));
        deletedAttempts++;
      }

      const metaSnap = await getDocs(collection(db, "exams_meta"));
      let deletedExams = 0;
      for (const d of metaSnap.docs) {
        await deleteDoc(doc(db, "exams_meta", d.id));
        deletedExams++;
      }

      setExams([]);

      alert(
        `ADMIN CLEANUP COMPLETE\n\nDeleted Exams: ${deletedExams}\nDeleted Results: ${deletedAttempts}`
      );
    } catch (err) {
      console.error("Admin cleanup failed:", err);
      alert("Cleanup failed. Check console.");
    }
  };

  /* ================= UI ================= */

  return (
    <div style={{ padding: "20px" }}>
      <h3>Exam Management</h3>

      <button onClick={onBack}>← Back</button>

      <hr />

      {/* ---------- CREATE MODE ---------- */}
      {mode === "create" && (
        <CreateExam
          onBack={() => {
            setMode("list");
            loadExams(); // refresh list after create
          }}
        />
      )}

      {/* ---------- LIST MODE ---------- */}
      {mode === "list" && (
        <>
          <button
            onClick={() => setMode("create")}
            style={{
              marginBottom: "10px",
              background: "#1976d2",
              color: "white",
              border: "none",
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            ➕ Create New Exam
          </button>

          {loading && <p>Loading exams...</p>}

          {!loading && exams.length === 0 && <p>No exams found.</p>}

          {!loading && exams.length > 0 && (
            <table
              border="1"
              cellPadding="8"
              style={{ borderCollapse: "collapse", width: "100%" }}
            >
              <thead style={{ background: "#f0f0f0" }}>
                <tr>
                  <th>#</th>
                  <th>Exam ID</th>
                  <th>Course</th>
                  <th>Chapters</th>
                  <th>Duration</th>
                  <th>Total Questions</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((e, index) => (
                  <tr key={e.id}>
                    <td>{index + 1}</td>
                    <td>{e.exam_id}</td>
                    <td>{e.course_id}</td>
                    <td>
                      {Array.isArray(e.chapters)
                        ? e.chapters.join(", ")
                        : <em>NA</em>}
                    </td>
                    <td>{e.duration_minutes}</td>
                    <td>{e.total_questions}</td>
                    <td>{e.active ? "YES" : "NO"}</td>
                    <td>
                      <button
                        onClick={() => onViewResults(e.exam_id)}
                        style={{ marginRight: "6px" }}
                      >
                        Results
                      </button>

                      <button
                        onClick={() => deleteExam(e.id, e.exam_id)}
                        style={{
                          background: "#b00020",
                          color: "white",
                          border: "none",
                          padding: "6px 10px",
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <hr />

          {/* ---------- ADMIN DANGER ZONE ---------- */}
          <div style={{ marginTop: "20px" }}>
            <h4 style={{ color: "#b00020" }}>⚠️ Admin Danger Zone</h4>

            <button
              onClick={deleteAllExams}
              style={{
                background: "#b00020",
                color: "white",
                border: "none",
                padding: "10px 14px",
                cursor: "pointer",
              }}
            >
              🚨 Delete ALL Exams & Results
            </button>

            <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
              This will permanently remove all exams and all student attempts.
              Use only for system cleanup.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default ExamManagement;

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

function ExamManagement({ onBack, onViewResults }) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

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

  /* ================= HARD DELETE EXAM ================= */

  const deleteExam = async (examDocId, examId) => {
    const confirm1 = window.confirm(
      `Are you sure you want to DELETE exam "${examId}"?\n\nThis will permanently delete the exam AND all student results.`,
    );

    if (!confirm1) return;

    const confirm2 = window.prompt(
      `Type DELETE to permanently delete exam "${examId}" and ALL its results`,
    );

    if (confirm2 !== "DELETE") {
      alert("Deletion cancelled");
      return;
    }

    try {
      /* ---------- DELETE RESULTS (ATTEMPTS) ---------- */
      const attemptsQuery = query(
        collection(db, "exams"),
        where("exam_id", "==", examId),
      );

      const attemptsSnap = await getDocs(attemptsQuery);

      let deletedAttempts = 0;
      for (const docSnap of attemptsSnap.docs) {
        await deleteDoc(doc(db, "exams", docSnap.id));
        deletedAttempts++;
      }

      /* ---------- DELETE EXAM META ---------- */
      await deleteDoc(doc(db, "exams_meta", examDocId));

      /* ---------- UPDATE UI ---------- */
      setExams((prev) => prev.filter((e) => e.id !== examDocId));

      alert(
        `Exam "${examId}" deleted successfully.\nDeleted ${deletedAttempts} result(s).`,
      );
    } catch (err) {
      console.error("Failed to delete exam and results:", err);
      alert("Deletion failed. Check console.");
    }
  };

  /* ================= UI ================= */

  return (
    <div style={{ padding: "20px" }}>
      <h3>Exam Management</h3>

      <button onClick={onBack}>← Back</button>

      <hr />

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
                  {Array.isArray(e.chapters) ? (
                    e.chapters.join(", ")
                  ) : (
                    <em>NA</em>
                  )}
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
    </div>
  );
}

export default ExamManagement;

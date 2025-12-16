import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "./../firebase";

function QuestionBank({ onBack }) {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  /* ================= LOAD COURSES ================= */

  useEffect(() => {
    async function loadCourses() {
      const snap = await getDocs(collection(db, "courses"));
      const list = snap.docs.map((doc) => doc.data());
      setCourses(list);
    }

    loadCourses();
  }, []);

  /* ================= LOAD QUESTIONS ================= */

  async function loadQuestions(courseId) {
    setLoading(true);

    const q = query(
      collection(db, "questions"),
      where("course_id", "==", courseId),
    );

    const snap = await getDocs(q);
    const list = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setQuestions(list);
    setLoading(false);
  }

  useEffect(() => {
    if (!selectedCourse) {
      setQuestions([]);
      return;
    }
    loadQuestions(selectedCourse);
  }, [selectedCourse]);

  /* ================= UPLOAD QUESTIONS ================= */

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setStatus("Reading file...");
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.course_id || !Array.isArray(data.questions)) {
        alert("Invalid JSON format");
        return;
      }

      let count = 0;

      for (const q of data.questions) {
        if (!q.chapter || !q.question_type || !q.question_text || !q.marks) {
          alert("Invalid question entry detected at question no " + q.question_no);
          return;
        }

        await addDoc(collection(db, "questions"), {
          course_id: data.course_id,
          chapter: q.chapter,
          difficulty: q.difficulty,
          question_type: q.question_type,
          question_text: q.question_text,
          options: q.options || {},
          correct_answer: q.correct_answer || [],
          marks: q.marks,
          created_at: Date.now(),
        });

        count++;
      }

      setStatus(`✅ ${count} questions uploaded successfully`);

      // Auto-refresh table
      if (selectedCourse === data.course_id) {
        loadQuestions(selectedCourse);
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading questions");
      setStatus("❌ Upload failed");
    }
  };

  const deleteAllQuestions = async () => {
    if (!selectedCourse) {
      alert("Please select a course first");
      return;
    }

    const confirm1 = window.confirm(
      `Are you sure you want to DELETE ALL questions for course ${selectedCourse}?`,
    );

    if (!confirm1) return;

    const confirm2 = window.prompt(
      `Type DELETE to confirm permanent deletion of ALL questions for ${selectedCourse}`,
    );

    if (confirm2 !== "DELETE") {
      alert("Deletion cancelled");
      return;
    }

    setStatus("Deleting questions...");

    const q = query(
      collection(db, "questions"),
      where("course_id", "==", selectedCourse),
    );

    const snap = await getDocs(q);

    let count = 0;
    for (const docSnap of snap.docs) {
      await deleteDoc(doc(db, "questions", docSnap.id));
      count++;
    }

    setQuestions([]);
    setStatus(`❌ ${count} questions permanently deleted`);
  };

  /* ================= UI ================= */

  return (
    <div style={{ padding: "20px" }}>
      <h3>Question Bank</h3>

      <button onClick={onBack}>← Back</button>

      <hr />

      {/* COURSE SELECT */}
      <div style={{ marginBottom: "15px" }}>
        <label>
          <strong>Select Course:</strong>{" "}
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="">-- Select --</option>
            {courses.map((c) => (
              <option key={c.course_id} value={c.course_id}>
                {c.course_id} – {c.course_name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedCourse && (
        <div style={{ marginBottom: "15px" }}>
          <button
            onClick={deleteAllQuestions}
            style={{
              background: "#b00020",
              color: "white",
              padding: "8px 12px",
              border: "none",
              cursor: "pointer",
            }}
          >
            🚨 Delete ALL Questions for {selectedCourse}
          </button>
        </div>
      )}

      {/* UPLOAD */}
      <div style={{ marginBottom: "20px" }}>
        <strong>Upload Questions (JSON):</strong>
        <br />
        <input type="file" accept=".json" onChange={handleFileUpload} />
        {status && <p>{status}</p>}
      </div>

      {/* QUESTIONS TABLE */}
      {loading && <p>Loading questions...</p>}

      {!loading && selectedCourse && questions.length === 0 && (
        <p>No questions found for this course.</p>
      )}

      {!loading && questions.length > 0 && (
        <table
          border="1"
          cellPadding="8"
          style={{ borderCollapse: "collapse", width: "100%" }}
        >
          <thead style={{ background: "#f0f0f0" }}>
            <tr>
              <th>#</th>
              <th>Chapter</th>
              <th>Difficulty</th>
              <th>Type</th>
              <th>Marks</th>
              <th>Question</th>
              <th>Options</th>
              <th>Correct</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q, index) => (
              <tr key={q.id}>
                <td>{index + 1}</td>
                <td>{q.chapter}</td>
                <td>{q.difficulty ? q.difficulty : <em>NA</em>}</td>
                <td>{q.question_type}</td>
                <td>{q.marks}</td>
                <td>{q.question_text}</td>
                <td>
                  {q.options && Object.keys(q.options).length > 0 ? (
                    Object.entries(q.options).map(([k, v]) => (
                      <div key={k}>
                        <strong>{k}.</strong> {v}
                      </div>
                    ))
                  ) : (
                    <em>N/A</em>
                  )}
                </td>
                <td>
                  {q.question_type === "DESCRIPTIVE" ? (
                    <em>Manual</em>
                  ) : Array.isArray(q.correct_answer) ? (
                    q.correct_answer.join(", ")
                  ) : (
                    q.correct_answer
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default QuestionBank;

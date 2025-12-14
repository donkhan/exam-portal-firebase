import { useEffect, useState } from "react";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "./firebase";

function CreateExam({ onBack }) {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [duration, setDuration] = useState(20);
  const [questionCount, setQuestionCount] = useState(10);
  const [status, setStatus] = useState("");

  /* ================= LOAD COURSES ================= */

  useEffect(() => {
    async function loadCourses() {
      const snap = await getDocs(collection(db, "courses"));
      const list = snap.docs.map(doc => doc.data());
      setCourses(list);
    }
    loadCourses();
  }, []);

  /* ================= CREATE EXAM ================= */

  const createExam = async () => {
    if (!courseId) {
      alert("Please select a course");
      return;
    }

    const examId = `EXAM_${courseId}_${Date.now()}`;

    const examMeta = {
      exam_id: examId,
      course_id: courseId,
      chapters: ["ALL"],            // for now
      question_types: ["MCQ", "FILL_BLANK", "MSQ"],
      duration_minutes: Number(duration),
      total_questions: Number(questionCount),
      active: true,
      created_at: Date.now()
    };

    await addDoc(collection(db, "exams_meta"), examMeta);

    setStatus(`✅ Exam created successfully.
Exam ID: ${examId}`);
  };

  /* ================= UI ================= */

  return (
    <div style={{ padding: "20px" }}>
      <h3>Create Exam</h3>

      <button onClick={onBack}>← Back</button>

      <hr />

      {/* COURSE */}
      <div style={{ marginBottom: "10px" }}>
        <label>
          Course:&nbsp;
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
          >
            <option value="">-- Select --</option>
            {courses.map(c => (
              <option key={c.course_id} value={c.course_id}>
                {c.course_id} – {c.course_name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* DURATION */}
      <div style={{ marginBottom: "10px" }}>
        <label>
          Duration (minutes):&nbsp;
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </label>
      </div>

      {/* QUESTION COUNT */}
      <div style={{ marginBottom: "10px" }}>
        <label>
          Number of Questions:&nbsp;
          <input
            type="number"
            value={questionCount}
            onChange={(e) => setQuestionCount(e.target.value)}
          />
        </label>
      </div>

      <button onClick={createExam}>Create Exam</button>

      {status && (
        <pre style={{ marginTop: "15px", whiteSpace: "pre-wrap" }}>
          {status}
        </pre>
      )}
    </div>
  );
}

export default CreateExam;

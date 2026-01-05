import { useEffect, useState } from "react";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "./../firebase";

function CreateExam({ preselectedCourseId, preselectedCourseName, onBack }) {
  /* ---------- COURSE CONTEXT ---------- */
  const [courseId, setCourseId] = useState(preselectedCourseId);

  /* ---------- CHAPTER STATE ---------- */
  const [chapters, setChapters] = useState([]);
  const [selectedChapters, setSelectedChapters] = useState([]);

  /* ---------- EXAM META ---------- */
  const [duration, setDuration] = useState(20);
  const [questionCount, setQuestionCount] = useState(10);
  const [status, setStatus] = useState("");
  const [examId, setExamId] = useState("");

  /* ================= LOAD CHAPTERS ================= */

  const loadChaptersForCourse = async (cid) => {
    const q = query(collection(db, "questions"), where("course_id", "==", cid));

    const snap = await getDocs(q);

    const uniqueChapters = [
      ...new Set(
        snap.docs
          .map((d) => d.data().chapter)
          .filter(Boolean)
          .map((ch) => ch.trim()),
      ),
    ];

    setChapters(uniqueChapters.sort());
    setSelectedChapters([]);
  };

  /* ---------- AUTO LOAD CHAPTERS ON ENTRY ---------- */
  useEffect(() => {
    if (courseId) {
      loadChaptersForCourse(courseId);
    }
  }, [courseId]);

  /* ================= CREATE EXAM ================= */

  const createExam = async () => {
    if (!courseId) {
      alert("Course context missing. Please go back and retry.");
      return;
    }

    if (!examId) {
      alert("Please enter Exam ID");
      return;
    }

    if (selectedChapters.length === 0) {
      alert("Please select at least one chapter");
      return;
    }

    const existing = await getDocs(
      query(collection(db, "exams_meta"), where("exam_id", "==", examId)),
    );

    if (!existing.empty) {
      alert("Exam ID already exists. Choose a different one.");
      return;
    }

    const examMeta = {
      exam_id: examId,
      course_id: preselectedCourseId,
      course_name: preselectedCourseName, // 🔥 stored for clarity
      chapters: selectedChapters,
      question_types: ["MCQ", "FILL_BLANK", "MSQ"],
      duration_minutes: Number(duration),
      total_questions: Number(questionCount),
      active: true,
      created_at: Date.now(),
    };

    await addDoc(collection(db, "exams_meta"), examMeta);

    setStatus(`✅ Exam created successfully.
Exam ID: ${examId}
Course: ${preselectedCourseName || courseId}
Chapters: ${selectedChapters.join(", ")}`);
  };

  /* ================= UI ================= */

  return (
    <div style={{ padding: "20px" }}>
      <h3>Create Exam</h3>

      <button onClick={onBack}>← Back</button>

      {/* COURSE CONTEXT (READ-ONLY) */}
      <div
        style={{
          marginTop: "10px",
          marginBottom: "15px",
          padding: "8px 12px",
          background: "#f4f6f8",
          border: "1px solid #dce3ea",
          borderRadius: 4,
        }}
      >
        <strong>Course:</strong> {preselectedCourseName || courseId}
      </div>

      <hr />

      {/* EXAM ID */}
      <div style={{ marginBottom: "10px" }}>
        <label>
          <strong>Exam ID</strong>
        </label>
        <br />
        <input
          type="text"
          placeholder="Enter Exam ID (e.g. AP_ICSE_10A)"
          value={examId}
          onChange={(e) => setExamId(e.target.value.trim())}
        />
        <p style={{ fontSize: "12px", color: "#666" }}>
          This ID will be shared with students
        </p>
      </div>

      {/* CHAPTER SELECTION */}
      {chapters.length > 0 ? (
        <div style={{ marginBottom: "15px" }}>
          <strong>Select Chapters:</strong>

          <div style={{ marginTop: "8px" }}>
            {chapters.map((ch) => (
              <label key={ch} style={{ display: "block" }}>
                <input
                  type="checkbox"
                  checked={selectedChapters.includes(ch)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedChapters([...selectedChapters, ch]);
                    } else {
                      setSelectedChapters(
                        selectedChapters.filter((c) => c !== ch),
                      );
                    }
                  }}
                />{" "}
                {ch}
              </label>
            ))}
          </div>
        </div>
      ) : (
        <p style={{ color: "#666" }}>No chapters found for this course.</p>
      )}

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

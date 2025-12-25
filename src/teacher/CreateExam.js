import { useEffect, useState } from "react";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "./../firebase";

function CreateExam({ onBack }) {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");

  const [chapters, setChapters] = useState([]);
  const [selectedChapters, setSelectedChapters] = useState([]);

  const [duration, setDuration] = useState(20);
  const [questionCount, setQuestionCount] = useState(10);
  const [status, setStatus] = useState("");
  const [examId, setExamId] = useState("");

  /* ================= LOAD COURSES ================= */

  useEffect(() => {
    async function loadCourses() {
      const snap = await getDocs(collection(db, "courses"));
      const list = snap.docs.map((doc) => doc.data());
      setCourses(list);
    }
    loadCourses();
  }, []);

  /* ================= LOAD CHAPTERS ================= */

  const loadChaptersForCourse = async (courseId) => {
    const q = query(
      collection(db, "questions"),
      where("course_id", "==", courseId),
    );

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

  useEffect(() => {
    if (courseId) {
      loadChaptersForCourse(courseId);
    } else {
      setChapters([]);
      setSelectedChapters([]);
    }
  }, [courseId]);

  /* ================= CREATE EXAM ================= */

  const createExam = async () => {
    if (!courseId) {
      alert("Please select a course");
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
      course_id: courseId,
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
Chapters: ${selectedChapters.join(", ")}`);
  };

  /* ================= UI ================= */

  return (
    <div style={{ padding: "20px" }}>
      <h3>Create Exam</h3>

      <button onClick={onBack}>← Back</button>

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

      {/* COURSE */}
      <div style={{ marginBottom: "10px" }}>
        <label>
          Course:&nbsp;
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
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

      {/* CHAPTER SELECTION */}
      {chapters.length > 0 && (
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

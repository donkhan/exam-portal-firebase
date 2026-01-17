import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom"; // ✅ ADD
import { db } from "./../firebase";
import { getChaptersForCourse } from "./../services/questions.service";
import { createExamIfNotExists } from "./../services/exam.service";

function CreateExam({ preselectedCourseId, preselectedCourseName, onBack }) {
  /* ---------- MODE ---------- */
  const isCourseLocked = Boolean(preselectedCourseId);

  /* ---------- NAV ---------- */
  const navigate = useNavigate(); // ✅ ADD

  /* ---------- COURSE STATE ---------- */
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState(preselectedCourseId || "");
  const [courseName, setCourseName] = useState(preselectedCourseName || "");

  /* ---------- CHAPTER STATE ---------- */
  const [chapters, setChapters] = useState([]);
  const [selectedChapters, setSelectedChapters] = useState([]);

  /* ---------- EXAM META ---------- */
  const [examId, setExamId] = useState("");
  const [duration, setDuration] = useState(20);
  const [questionCount, setQuestionCount] = useState(10);
  const [status, setStatus] = useState("");
  const [createdExamId, setCreatedExamId] = useState(null); // ✅ ADD

  /* ---------- SUBMISSION RULE ---------- */
  const [allowEarlySubmit, setAllowEarlySubmit] = useState(false);

  /* ---------- LOAD COURSES (ONLY IF REQUIRED) ---------- */
  useEffect(() => {
    if (isCourseLocked) return;

    const loadCourses = async () => {
      const snap = await getDocs(collection(db, "courses"));
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setCourses(list);
    };

    loadCourses();
  }, [isCourseLocked]);

  /* ---------- LOAD CHAPTERS ---------- */
  useEffect(() => {
    if (!courseId) {
      setChapters([]);
      setSelectedChapters([]);
      return;
    }

    const load = async () => {
      const ch = await getChaptersForCourse(courseId);
      setChapters(ch);
      setSelectedChapters([]);
    };

    load();
  }, [courseId]);

  /* ---------- CREATE EXAM ---------- */
  const createExam = async () => {
    const effectiveCourseId = courseId;
    const effectiveCourseName =
      courseName || courses.find((c) => c.id === courseId)?.course_name;

    if (!effectiveCourseId) {
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

    const examMeta = {
      exam_id: examId,
      course_id: effectiveCourseId,
      course_name: effectiveCourseName,
      chapters: selectedChapters,
      question_types: ["MCQ", "FILL_BLANK", "MSQ"],
      duration_minutes: Number(duration),
      total_questions: Number(questionCount),
      active: true,
      allowEarlySubmit,
      created_at: Date.now(),
    };

    const created = await createExamIfNotExists(examId, examMeta);
    if (!created) {
      alert(`❌ Exam ID "${examId}" already exists.`);
      return;
    }

    setCreatedExamId(examId); // ✅ ENABLE PREVIEW
    setStatus(
      `✅ Exam created successfully
Exam ID: ${examId}
Course: ${effectiveCourseName}
Chapters: ${selectedChapters.join(", ")}`
    );
  };

  /* ================= UI ================= */

  return (
    <div style={{ padding: "20px" }}>
      <h3>Create Exam</h3>
      <button onClick={onBack}>← Back</button>

      {/* COURSE SECTION */}
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
        <strong>Course:</strong>{" "}
        {isCourseLocked ? (
          <span>{courseName}</span>
        ) : (
          <select
            value={courseId}
            onChange={(e) => {
              const cid = e.target.value;
              setCourseId(cid);
              const c = courses.find((x) => x.id === cid);
              setCourseName(c?.course_name || "");
            }}
          >
            <option value="">-- Select Course --</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.course_name}
              </option>
            ))}
          </select>
        )}
      </div>

      <hr />

      {/* EXAM ID */}
      <div style={{ marginBottom: "10px" }}>
        <label><strong>Exam ID</strong></label>
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
                    setSelectedChapters(
                      e.target.checked
                        ? [...selectedChapters, ch]
                        : selectedChapters.filter((c) => c !== ch)
                    );
                  }}
                />{" "}
                {ch}
              </label>
            ))}
          </div>
        </div>
      ) : (
        courseId && <p style={{ color: "#666" }}>No chapters found.</p>
      )}

      {/* DURATION */}
      <div style={{ marginBottom: "10px" }}>
        <label>
          Duration (minutes):{" "}
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
          Number of Questions:{" "}
          <input
            type="number"
            value={questionCount}
            onChange={(e) => setQuestionCount(e.target.value)}
          />
        </label>
      </div>

      {/* SUBMISSION RULE */}
      <div
        style={{
          marginTop: "15px",
          marginBottom: "15px",
          padding: "10px 12px",
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: 4,
        }}
      >
        <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="checkbox"
            checked={!allowEarlySubmit}
            onChange={(e) => setAllowEarlySubmit(!e.target.checked)}
          />
          <strong>Prevent early submission (recommended)</strong>
        </label>

        <p style={{ fontSize: "12px", color: "#666", marginTop: "6px" }}>
          Students can submit only after <strong>75% of exam time</strong> is completed.
          Uncheck to allow submission anytime.
        </p>
      </div>

      <button onClick={createExam}>Create Exam</button>

      {/* ✅ PREVIEW / TAKE EXAM */}
      <button
        style={{ marginLeft: "10px" }}
        disabled={!createdExamId}
        onClick={() => navigate(`/exam/${createdExamId}`)}
      >
        Preview / Take Exam
      </button>

      {status && (
        <pre style={{ marginTop: "15px", whiteSpace: "pre-wrap" }}>
          {status}
        </pre>
      )}
    </div>
  );
}

export default CreateExam;

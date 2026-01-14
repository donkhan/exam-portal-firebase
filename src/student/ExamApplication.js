import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  collection,
  getDocs,
  getDoc,
  query,
  where,
  setDoc,
  doc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { getDeviceType } from "../utils/device";
import { auth, db } from "./../firebase";
import "./../App.css";
import ExamInstructions from "./ExamInstructions";

function ExamApplication() {
  const [user, setUser] = useState(null);
  const [examIdInput, setExamIdInput] = useState("");
  const [error, setError] = useState("");

  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [courseName, setCourseName] = useState("");

  // 🔑 THIS is the missing link earlier
  const [activeExamId, setActiveExamId] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  /* ================= AUTH ================= */

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const login = async () => {
    await signInWithPopup(auth, new GoogleAuthProvider());
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setExam(null);
    setAnswers({});
    setCurrentIndex(0);
    setTimeLeft(null);
    setExamIdInput("");
    setActiveExamId(null);
    localStorage.removeItem("activeExamId");
  };

  /* ================= RESTORE ACTIVE EXAM ON REFRESH ================= */

  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem("activeExamId");
    if (stored) {
      setActiveExamId(stored);
    }
  }, [user]);

  useEffect(() => {
    if (!exam?.course_id) return;

    async function fetchCourseName() {
      try {
        const courseRef = doc(db, "courses", exam.course_id);
        const snap = await getDoc(courseRef);
        if (snap.exists()) {
          setCourseName(snap.data().course_name || exam.course_id);
        } else {
          setCourseName(exam.course_id);
        }
      } catch {
        setCourseName(exam.course_id);
      }
    }

    fetchCourseName();
  }, [exam?.course_id]);

  /* ================= REALTIME EXAM LISTENER ================= */

  useEffect(() => {
    if (exam?.status === "EVALUATED") {
      localStorage.removeItem("activeExamId");
      // keep activeExamId in state so results remain visible
    }
  }, [exam?.status]);

  useEffect(() => {
    if (!user || !activeExamId) return;

    const examRef = doc(db, "exams", `${activeExamId}_${user.uid}`);

    const unsub = onSnapshot(examRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      setExam(data);
      setAnswers(data.answers || {});
    });

    return () => unsub();
  }, [user, activeExamId]);

  /* ================= HELPERS ================= */

  function shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
  }

  /* ================= JOIN EXAM ================= */

  async function joinExam() {
    if (!user) return setError("Please login");
    if (!examIdInput) return setError("Enter Exam ID");

    setError("");

    const examDocId = `${examIdInput}_${user.uid}`;
    const examRef = doc(db, "exams", examDocId);

    // 🔍 STEP 1: Check if exam already exists
    const existingSnap = await getDoc(examRef);

    if (existingSnap.exists()) {
      const existingExam = existingSnap.data();

      // ✅ Exam already finished → show results
      if (existingExam.submitted) {
        setActiveExamId(examIdInput);
        setCurrentIndex(0);
        return;
      }

      // ✅ Exam in progress → resume
      setActiveExamId(examIdInput);
      setCurrentIndex(0);
      return;
    }

    // 🆕 STEP 2: Fresh exam creation
    const metaSnap = await getDocs(
      query(collection(db, "exams_meta"), where("exam_id", "==", examIdInput)),
    );

    if (metaSnap.empty) return setError("Invalid Exam ID");

    const examMeta = metaSnap.docs[0].data();
    if (!examMeta.active) return setError("Exam not active");

    const qSnap = await getDocs(
      query(
        collection(db, "questions"),
        where("course_id", "==", examMeta.course_id),
      ),
    );

    let allQuestions = qSnap.docs.map((d) => {
      const q = d.data();
      return {
        id: d.id,
        question_text: q.question_text,
        options: q.options,
        question_type: q.question_type,
        marks: q.marks,
        difficulty: q.difficulty,
        chapter: q.chapter,
      };
    });

    if (!examMeta.question_types.includes("ALL")) {
      allQuestions = allQuestions.filter((q) =>
        examMeta.question_types.includes(q.question_type),
      );
    }

    if (!examMeta.chapters.includes("ALL")) {
      allQuestions = allQuestions.filter((q) =>
        examMeta.chapters.includes(q.chapter),
      );
    }

    if (allQuestions.length < examMeta.total_questions) {
      return setError("Not enough questions");
    }

    const selectedQuestions = shuffle(allQuestions).slice(
      0,
      examMeta.total_questions,
    );

    const start = Date.now();
    const end = start + examMeta.duration_minutes * 60 * 1000;

    const examDoc = {
      exam_id: examIdInput,
      course_id: examMeta.course_id,
      user_id: user.uid,
      user_email: user.email || "",
      user_name: user.displayName || "",
      questions: selectedQuestions,
      answers: {},
      submitted: false,
      status: "IN_PROGRESS",
      started_at: start,
      end_at: end,
      allowEarlySubmit: examMeta.allowEarlySubmit ?? false, 
      device_type: getDeviceType(),
    };

    await setDoc(examRef, examDoc);

    localStorage.setItem("activeExamId", examIdInput);
    setActiveExamId(examIdInput);
    setCurrentIndex(0);
  }

  /* ================= TIMER ================= */

  useEffect(() => {
    if (!exam || exam.submitted) return;

    const interval = setInterval(() => {
      const remaining = exam.end_at - Date.now();

      if (remaining <= 0) {
        clearInterval(interval);
        finalizeSubmission("auto");
      } else {
        setTimeLeft(Math.floor(remaining / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [exam?.end_at, exam?.submitted]);

  /* ================= ANSWERS ================= */

  async function persist(newAnswers) {
    setAnswers(newAnswers);
    await updateDoc(doc(db, "exams", `${exam.exam_id}_${user.uid}`), {
      answers: newAnswers,
    });
  }

  const selectMCQ = (k) => {
    if (exam.submitted) return;
    persist({ ...answers, [currentIndex]: [k] });
  };

  const toggleMSQ = (k) => {
    if (exam.submitted) return;
    const cur = answers[currentIndex] || [];
    const upd = cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k];
    persist({ ...answers, [currentIndex]: upd });
  };

  const updateFill = (v) => {
    if (exam.submitted) return;
    persist({ ...answers, [currentIndex]: v });
  };

  /* ================= SUBMIT ================= */

  async function finalizeSubmission(reason) {
    if (!exam || exam.submitted || submitting) return;

    setSubmitting(true);

    try {
      await updateDoc(doc(db, "exams", `${exam.exam_id}_${user.uid}`), {
        submitted: true,
        submitted_at: Date.now(),
        submission_type: reason,
        status: "SUBMITTED",
      });
    } finally {
      setSubmitting(false);
    }
  }

  /* ================= SUBMIT LOCK (75% RULE) ================= */

let canSubmit = true;
let submitUnlockInSec = 0;

if (exam && !exam.submitted) {
  const durationMs = exam.end_at - exam.started_at;
  const elapsedMs = Date.now() - exam.started_at;
  const minSubmitMs = durationMs * 0.75;

  if (!exam.allowEarlySubmit && elapsedMs < minSubmitMs) {
    canSubmit = false;
    submitUnlockInSec = Math.ceil((minSubmitMs - elapsedMs) / 1000);
  }
}

const formatMMSS = (sec) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};


  /* ================= UI ================= */

  const q = exam?.questions?.[currentIndex];

  return (
    <div className="app-container">
      <h2 align="center">Online Exam</h2>

      {!user && <button onClick={login}>Login with Google</button>}
      {user && <button onClick={logout}>Logout</button>}

      <br />
      <br />

      {user && (
        <div className="student-info">
          <strong>{user.displayName}</strong>
          <br />
          {user.email}
          <br />
          <button
            style={{ float: "right", marginBottom: "10px" }}
            onClick={() => setShowInstructions(true)}
          >
            ⓘ Instructions
          </button>

          <br />
        </div>
      )}

      <br />

      {exam && (
        <div className="exam-info">
          <strong>Exam ID:</strong> {exam.exam_id}
          <br />
          <strong>Course:</strong> {courseName}
          <br />
          <br />
        </div>
      )}

      {exam && (
        <div className="attempt-status">
          <strong>Attempt Status:</strong>{" "}
          {exam.status === "IN_PROGRESS" && "In Progress"}
          {exam.status === "SUBMITTED" && "Submitted (Evaluating)"}
          {exam.status === "EVALUATED" && "Evaluated"}
          <br />
          <br />
        </div>
      )}

      {!exam && user && showInstructions && (
        <ExamInstructions
          onProceed={() => {
            setShowInstructions(false);
            joinExam(); // your EXISTING logic
          }}
        />
      )}

      {exam && showInstructions && (
        <div className="modal-backdrop">
          <div className="modal">
            <ExamInstructions
              showClose
              onProceed={() => setShowInstructions(false)}
            />
          </div>
        </div>
      )}

      {!exam && user && !showInstructions && (
        <>
          <input
            value={examIdInput}
            onChange={(e) => setExamIdInput(e.target.value)}
            placeholder="Enter Exam ID"
          />
          <br />
          <br />
          <button onClick={() => setShowInstructions(true)}>Join Exam</button>
          {error && <p className="error">{error}</p>}
        </>
      )}

      {exam && q && (
        <>
          {!exam.submitted && timeLeft !== null && (
            <p>
              Time Left: {Math.floor(timeLeft / 60)}:
              {String(timeLeft % 60).padStart(2, "0")}
            </p>
          )}

          <h3>
            Q{currentIndex + 1}. {q.question_text}
          </h3>

          {q.question_type === "MCQ" &&
            Object.entries(q.options).map(([k, v], idx) => (
              <label key={k} className="mcq-option">
                <input
                  type="radio"
                  name={`q-${q.question_id}`}
                  checked={answers[currentIndex]?.[0] === k}
                  onChange={() => selectMCQ(k)}
                />
                <span className="option-key">{k}.</span>
                <span className="option-text">{v}</span>
              </label>
            ))}

          {q.question_type === "MSQ" &&
            Object.entries(q.options).map(([k, v]) => (
              <label key={k}>
                <input
                  type="checkbox"
                  checked={(answers[currentIndex] || []).includes(k)}
                  onChange={() => toggleMSQ(k)}
                />
                {k}. {v}
              </label>
            ))}

          {q.question_type === "FILL_BLANK" && (
            <input
              value={answers[currentIndex] || ""}
              onChange={(e) => updateFill(e.target.value)}
            />
          )}

          <br />
          <br />

          <div className="question-nav">
            <button
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => i - 1)}
            >
              Prev
            </button>

            <button
              disabled={currentIndex === exam.questions.length - 1}
              onClick={() => setCurrentIndex((i) => i + 1)}
            >
              Next
            </button>

            <select
              value={currentIndex}
              disabled={exam.submitted}
              onChange={(e) => setCurrentIndex(Number(e.target.value))}
              className="question-jump"
            >
              {exam.questions.map((_, i) => (
                <option key={i} value={i}>
                  Q{i + 1}
                </option>
              ))}
            </select>

            {currentIndex === exam.questions.length - 1 && !exam.submitted && (
  <>
    <button
      disabled={submitting || !canSubmit}
      onClick={() => setShowSubmitModal(true)}
      style={{
        opacity: canSubmit ? 1 : 0.6,
        cursor: canSubmit ? "pointer" : "not-allowed",
      }}
    >
      Submit
    </button>

    {!canSubmit && (
      <p style={{ fontSize: "12px", color: "#666", marginTop: "6px" }}>
        Submit available in{" "}
        <strong>{formatMMSS(submitUnlockInSec)}</strong>
      </p>
    )}
  </>
)}



          </div>
          {showSubmitModal && (
            <div className="modal-backdrop">
              <div className="modal">
                <h3>Confirm Submission</h3>

                <p>
                  Are you sure you want to submit the exam?
                  <br />
                  <strong>This action cannot be undone.</strong>
                </p>

                <div className="modal-actions">
                  <button onClick={() => setShowSubmitModal(false)}>
                    Cancel
                  </button>

                  <button
                    disabled={submitting}
                    onClick={() => {
                      setShowSubmitModal(false);
                      finalizeSubmission("manual");
                    }}
                  >
                    Yes, Submit Exam
                  </button>
                </div>
              </div>
            </div>
          )}

          {exam.status === "SUBMITTED" && <p>Evaluating your answers…</p>}

          {exam.status === "EVALUATED" && (
            <div className="success">
              <br />
              <h3>Result</h3>

              <p>
                <strong>Score:</strong> {exam.score} / {exam.max_score}
              </p>

              <p>
                Correct: {exam.result_summary.correct}
                <br />
                Wrong: {exam.result_summary.wrong}
                <br />
                Unanswered: {exam.result_summary.unanswered}
              </p>

              <br />

              <h4>Question-wise Result</h4>

              {exam.question_results.map((res, i) => (
                <div key={i}>
                  <strong>Question {i + 1}:</strong>{" "}
                  {res.is_correct ? "✅ Correct" : "❌ Wrong"}
                  <br />
                  Marks Awarded: {res.marks_awarded}
                  <br />
                  <br />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ExamApplication;

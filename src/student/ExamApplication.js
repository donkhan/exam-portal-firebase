import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
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
import { useParams, useNavigate } from "react-router-dom";

import { auth, db } from "./../firebase";
import { getDeviceType } from "../utils/device";
import { MATH_QUOTES } from "../constants/mathQuotes";

import ExamHeader from "./ExamHeader";
import ExamQuestionPanel from "./ExamQuestionPanel";
import ExamActionBar from "./ExamActionBar";
import ExamResult from "./ExamResult";
import ExamFeedback from "./ExamFeedback";
import QuotePanel from "./QuotePanel";

import "./../App.css";
import "./student.css";
import { isInstructor } from "../utils/isInstructor";


function ExamApplication() {
  const navigate = useNavigate();
  const { examId } = useParams();
  const activeExamId = examId;

  /* ================= STATE ================= */

  const [user, setUser] = useState(null);
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [courseName, setCourseName] = useState("");

  const [showInstructions, setShowInstructions] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  /* ================= AUTH ================= */

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setExam(null);
    setAnswers({});
    setCurrentIndex(0);
    setTimeLeft(null);
    navigate("/");
  };

  /* ================= SHOW INSTRUCTIONS INITIALLY ================= */

  useEffect(() => {
    if (user && !exam) {
      setShowInstructions(true);
    }
  }, [user, exam]);

  /* ================= COURSE NAME ================= */

  useEffect(() => {
    if (!exam?.course_id) return;

    (async () => {
      try {
        const snap = await getDoc(doc(db, "courses", exam.course_id));
        setCourseName(
          snap.exists()
            ? snap.data().course_name || exam.course_id
            : exam.course_id
        );
      } catch {
        setCourseName(exam.course_id);
      }
    })();
  }, [exam?.course_id]);

  /* ================= REALTIME EXAM ================= */

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

  /* ================= JOIN / RESUME EXAM ================= */

  async function joinExam() {
    const examRef = doc(db, "exams", `${activeExamId}_${user.uid}`);
    const existingSnap = await getDoc(examRef);

    if (existingSnap.exists()) {
      setCurrentIndex(0);
      return;
    }

    const metaSnap = await getDocs(
      query(collection(db, "exams_meta"), where("exam_id", "==", activeExamId))
    );

    const examMeta = metaSnap.docs[0].data();
    if (!examMeta.active) return;

    const qSnap = await getDocs(
      query(
        collection(db, "questions"),
        where("course_id", "==", examMeta.course_id)
      )
    );

    let allQuestions = qSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    if (!examMeta.question_types.includes("ALL")) {
      allQuestions = allQuestions.filter((q) =>
        examMeta.question_types.includes(q.question_type)
      );
    }

    if (!examMeta.chapters.includes("ALL")) {
      allQuestions = allQuestions.filter((q) =>
        examMeta.chapters.includes(q.chapter)
      );
    }

    const selectedQuestions = allQuestions
      .sort(() => Math.random() - 0.5)
      .slice(0, examMeta.total_questions);

    const start = Date.now();
    const end = start + examMeta.duration_minutes * 60 * 1000;

    await setDoc(examRef, {
      exam_id: activeExamId,
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
    });

    setCurrentIndex(0);
  }

  /* ================= TIMER ================= */

  useEffect(() => {
    if (!exam || exam.submitted || !exam.end_at) return;

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

  const selectMCQ = (k) =>
    !exam.submitted && persist({ ...answers, [currentIndex]: [k] });

  const toggleMSQ = (k) => {
    if (exam.submitted) return;
    const cur = answers[currentIndex] || [];
    persist({
      ...answers,
      [currentIndex]: cur.includes(k)
        ? cur.filter((x) => x !== k)
        : [...cur, k],
    });
  };

  const updateFill = (v) =>
    !exam.submitted && persist({ ...answers, [currentIndex]: v });

  /* ================= SUBMIT ================= */

  async function finalizeSubmission(reason) {
    if (!exam || exam.submitted || submitting) return;

    setSubmitting(true);

    await updateDoc(doc(db, "exams", `${exam.exam_id}_${user.uid}`), {
      submitted: true,
      submitted_at: Date.now(),
      submission_type: reason,
      status: "SUBMITTED",
      evaluate_request_id: Date.now(),
    });

    setSubmitting(false);
    setShowFeedback(true);
  }

  /* ================= SUBMIT LOCK ================= */

  let canSubmit = true;
  let submitUnlockInSec = 0;

  if (
    exam &&
    !exam.submitted &&
    typeof exam.started_at === "number" &&
    typeof exam.end_at === "number"
  ) {
    const duration = exam.end_at - exam.started_at;
    const elapsed = Date.now() - exam.started_at;
    const minSubmit = duration * 0.75;

    if (!exam.allowEarlySubmit && elapsed < minSubmit) {
      canSubmit = false;
      submitUnlockInSec = Math.max(
        0,
        Math.ceil((minSubmit - elapsed) / 1000)
      );
    }
  }

  /* ================= UI ================= */

  const q = exam?.questions?.[currentIndex];
  const quote = MATH_QUOTES[currentIndex % MATH_QUOTES.length];

  return (
    <div className="app-container">
      <h2 align="center">Online Exam</h2>
      {isInstructor(user) && (
  <div style={{ marginBottom: "10px" }}>
    <button
      onClick={() => navigate(-1)}
      style={{
        background: "transparent",
        border: "none",
        color: "#2563eb",
        cursor: "pointer",
        fontSize: "14px",
        padding: 0,
      }}
    >
      ← Back to Dashboard
    </button>
  </div>
)}

      <ExamHeader
        user={user}
        exam={exam}
        activeExamId={activeExamId}
        courseName={courseName}
        onLogout={logout}
        showInstructions={showInstructions}
        setShowInstructions={setShowInstructions}
        onJoinExam={joinExam}
      />

      <QuotePanel quote={quote} />

      <ExamQuestionPanel
        exam={exam}
        q={q}
        currentIndex={currentIndex}
        answers={answers}
        timeLeft={timeLeft}
        onPrev={() => setCurrentIndex((i) => i - 1)}
        onNext={() => setCurrentIndex((i) => i + 1)}
        onJump={(i) => setCurrentIndex(i)}
        onSelectMCQ={selectMCQ}
        onToggleMSQ={toggleMSQ}
        onUpdateFill={updateFill}
      />

      {exam?.questions && (
        <ExamActionBar
          exam={exam}
          currentIndex={currentIndex}
          totalQuestions={exam.questions.length}
          canSubmit={canSubmit}
          submitting={submitting}
          submitUnlockInSec={submitUnlockInSec}
          onSubmitClick={() => setShowSubmitModal(true)}
        />
      )}

      {/* SUBMIT MODAL */}
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

      {/* FEEDBACK MODAL */}
      {showFeedback && exam && user && (
        <div className="modal-backdrop">
          <div className="modal">
            <ExamFeedback
              exam={exam}
              user={user}
              onDone={() => setShowFeedback(false)}
            />
          </div>
        </div>
      )}

      <ExamResult exam={exam} />
    </div>
  );
}

export default ExamApplication;

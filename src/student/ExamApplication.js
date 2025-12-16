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
  query,
  where,
  setDoc,
  getDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "./../firebase";
import "./../App.css";

function ExamApplication() {
  const [user, setUser] = useState(null);

  const [examIdInput, setExamIdInput] = useState("");
  const [error, setError] = useState("");

  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);

  /* ================= AUTH ================= */

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setExam(null);
    setAnswers({});
    setCurrentIndex(0);
    setTimeLeft(null);
    setExamIdInput("");
  };

  useEffect(() => {
    if (!user) return;

    async function resumeExam() {
      const storedExamId = localStorage.getItem("activeExamId");
      if (!storedExamId) return;

      const examDocRef = doc(db, "exams", `${storedExamId}_${user.uid}`);

      const snap = await getDoc(examDocRef);

      if (!snap.exists()) {
        localStorage.removeItem("activeExamId");
        return;
      }

      const examData = snap.data();

      if (examData.submitted) {
        localStorage.removeItem("activeExamId");
        return;
      }

      // Restore exam
      setExam(examData);
      setAnswers(examData.answers || {});
      setCurrentIndex(0);
    }

    resumeExam();
  }, [user]);

  function shuffle(array) {
    return [...array].sort(() => Math.random() - 0.5);
  }

  /* ================= JOIN EXAM ================= */

  async function joinExam() {
    if (!user) {
      setError("User not authenticated yet. Please wait and try again.");
      return;
    }
    if (!examIdInput) {
      setError("Please enter Exam ID");
      return;
    }

    setError("");

    /* 1️⃣ Fetch exam metadata */
    const metaSnap = await getDocs(
      query(collection(db, "exams_meta"), where("exam_id", "==", examIdInput)),
    );

    if (metaSnap.empty) {
      setError("Invalid Exam ID");
      return;
    }

    const examMeta = metaSnap.docs[0].data();

    if (!examMeta.active) {
      setError("This exam is not active");
      return;
    }

    /* 2️⃣ Fetch question bank */
    const qSnap = await getDocs(
      query(
        collection(db, "questions"),
        where("course_id", "==", examMeta.course_id),
      ),
    );

    let allQuestions = qSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    /* Filter by question type */
    if (!examMeta.question_types.includes("ALL")) {
      allQuestions = allQuestions.filter((q) =>
        examMeta.question_types.includes(q.question_type),
      );
    }

    /* Filter by chapter */
    if (!examMeta.chapters.includes("ALL")) {
      allQuestions = allQuestions.filter((q) =>
        examMeta.chapters.includes(q.chapter),
      );
    }

    if (allQuestions.length < examMeta.total_questions) {
      setError("Not enough questions available for this exam");
      return;
    }

    /* 3️⃣ SELECT QUESTIONS (NO REPETITION GUARANTEED) */

    const total = examMeta.total_questions;
    let selectedQuestions = [];

    // How many difficulty levels actually exist?
    const difficultySet = new Set(allQuestions.map((q) => q.difficulty));

    /* CASE 1: Only ONE difficulty (e.g., all HARD) */
    if (difficultySet.size === 1) {
      selectedQuestions = shuffle(allQuestions).slice(0, total);
    } else {

    /* CASE 2: Multiple difficulties → balanced selection */
      const easyQs = allQuestions.filter((q) => q.difficulty === "EASY");
      const mediumQs = allQuestions.filter((q) => q.difficulty === "MEDIUM");
      const hardQs = allQuestions.filter((q) => q.difficulty === "HARD");

      let easyCount = Math.floor(total * 0.4);
      let mediumCount = Math.floor(total * 0.4);
      let hardCount = total - easyCount - mediumCount;

      const selected = [];
      const selectedIds = new Set();

      function pickFrom(bucket, count) {
        for (let q of shuffle(bucket)) {
          if (selected.length >= total) break;
          if (selectedIds.has(q.id)) continue;

          selected.push(q);
          selectedIds.add(q.id);

          if (--count === 0) break;
        }
      }

      pickFrom(easyQs, easyCount);
      pickFrom(mediumQs, mediumCount);
      pickFrom(hardQs, hardCount);

      // Fallback if any bucket is short
      if (selected.length < total) {
        pickFrom(allQuestions, total - selected.length);
      }

      selectedQuestions = shuffle(selected);
    }

    /* 4️⃣ Create student exam document */
    const startTime = Date.now();
    const endTime = startTime + examMeta.duration_minutes * 60 * 1000;

    console.log("AUTH USER AT EXAM START:", {
      uid: user.uid,
      email: user.email,
      name: user.displayName,
    });

    const examDoc = {
      exam_id: examIdInput,
      course_id: examMeta.course_id,

      user_id: user.uid,
      user_email: user.email || "",
      user_name: user.displayName || "",

      questions: selectedQuestions,
      answers: {},
      submitted: false,
      started_at: startTime,
      end_at: endTime,
    };

    const examDocId = `${examIdInput}_${user.uid}`;

    await setDoc(doc(db, "exams", examDocId), examDoc);

    localStorage.setItem("activeExamId", examIdInput);
    setExam(examDoc);
    setAnswers({});
    setCurrentIndex(0);
  }

  /* ================= TIMER ================= */

  useEffect(() => {
    if (!exam || exam.submitted) return;

    const interval = setInterval(() => {
      const remaining = exam.end_at - Date.now();

      if (remaining <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
        finalizeSubmission("auto");
      } else {
        setTimeLeft(Math.floor(remaining / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [exam]);

 
  /* ================= ANSWERS ================= */

  const selectMCQ = async (option) => {
    if (exam.submitted) return;

    const newAnswers = {
      ...answers,
      [currentIndex]: [option],
    };

    setAnswers(newAnswers);

    await updateDoc(doc(db, "exams", `${exam.exam_id}_${user.uid}`), {
      answers: newAnswers,
    });
  };

  const updateFillBlank = async (value) => {
    if (exam.submitted) return;

    const newAnswers = {
      ...answers,
      [currentIndex]: value,
    };

    setAnswers(newAnswers);

    await updateDoc(doc(db, "exams", `${exam.exam_id}_${user.uid}`), {
      answers: newAnswers,
    });
  };

  const toggleMSQOption = async (option) => {
    if (exam.submitted) return;

    const existing = answers[currentIndex] || [];
    let updated;

    if (existing.includes(option)) {
      updated = existing.filter((o) => o !== option);
    } else {
      updated = [...existing, option];
    }

    const newAnswers = {
      ...answers,
      [currentIndex]: updated,
    };

    setAnswers(newAnswers);

    await updateDoc(doc(db, "exams", `${exam.exam_id}_${user.uid}`), {
      answers: newAnswers,
    });
  };

  function calculateScoreFromAnswers(answersMap, questions) {
  let score = 0;

  questions.forEach((q, index) => {
    const studentAnswer = answersMap[index];
    if (studentAnswer === undefined) return;

    if (q.question_type === "MCQ") {
      if (
        Array.isArray(studentAnswer) &&
        q.correct_answer.includes(studentAnswer[0])
      ) {
        score += q.marks || 1;
      }
    }

    else if (q.question_type === "MSQ") {
      const correct = new Set(q.correct_answer);
      const given = new Set(studentAnswer || []);

      if (
        correct.size === given.size &&
        [...correct].every(v => given.has(v))
      ) {
        score += q.marks || 1;
      }
    }

    else if (q.question_type === "FILL_BLANK") {
      let a = String(studentAnswer).trim().toLowerCase();
      let c = String(q.correct_answer).trim().toLowerCase();
      if (a === c) score += q.marks || 1;
    }
  });

  return score;
}


  async function finalizeSubmission(reason) {
  if (!exam || exam.submitted) return;

  const examRef = doc(db, "exams", `${exam.exam_id}_${user.uid}`);
  const snap = await getDoc(examRef);

  if (!snap.exists()) {
    alert("Exam data not found");
    return;
  }

  const latestExam = snap.data();
  const latestAnswers = latestExam.answers || {};

  const score = calculateScoreFromAnswers(
    latestAnswers,
    latestExam.questions
  );

  await updateDoc(examRef, {
    submitted: true,
    submitted_at: Date.now(),
    score: score,
    submission_type: reason,          // "manual" | "auto"
    user_email: user.email || "",
    user_name: user.displayName || ""
  });

  setExam({
    ...latestExam,
    submitted: true,
    score: score
  });

  localStorage.removeItem("activeExamId");

  if (reason === "auto") {
    alert("Time is up! Exam auto-submitted.");
  } else {
    alert("Exam submitted successfully.");
  }
}


  /* ================= UI ================= */

  const currentQuestion = exam?.questions[currentIndex];

  return (
    <div className="app-container">
      <h2 align="center">Online Exam</h2>

      {!user && (
        <div className="login-wrapper">
          <div className="app-container" style={{ maxWidth: "420px" }}>
            <h2>Student Exam Portal</h2>
            <p>Please sign in to continue</p>
            <button onClick={login}>Login with Google</button>
          </div>
        </div>
      )}

      {user && (
        <>
          <p>
            <strong>{user.displayName}</strong>
            <br />
            {user.email}
          </p>
          <button onClick={logout}>Logout</button>
        </>
      )}

      <hr />

      {user && !exam && (
        <div>
          <p>Enter Exam ID provided by your teacher:</p>
          <input
            type="text"
            value={examIdInput}
            onChange={(e) => setExamIdInput(e.target.value)}
            placeholder="EXAM_MATH7_..."
          />
          <br />
          <br />
          <button onClick={joinExam}>Join Exam</button>
          {error && <p class="error">{error}</p>}
        </div>
      )}

      {exam && currentQuestion && (
        <div>
          {!exam.submitted && timeLeft !== null && (
            <p className="timer">
              Time Left: {Math.floor(timeLeft / 60)}:
              {(timeLeft % 60).toString().padStart(2, "0")}
            </p>
          )}
          <div className="question-box">
            <h3>
              Question {currentIndex + 1} of {exam.questions.length}
            </h3>
            <p>{currentQuestion.question_text}</p>
          </div>

          {currentQuestion.question_type === "MCQ" &&
            Object.entries(currentQuestion.options).map(([k, v]) => (
              <div key={k}>
                <div className="option">
                  <label>
                    <input
                      type="radio"
                      checked={answers[currentIndex]?.[0] === k}
                      disabled={exam.submitted}
                      onChange={() => selectMCQ(k)}
                    />
                    {` ${k}. ${v}`}
                  </label>
                </div>
              </div>
            ))}

          {currentQuestion.question_type === "FILL_BLANK" && (
            <div>
              <input
                type="text"
                value={answers[currentIndex] || ""}
                onChange={(e) => updateFillBlank(e.target.value)}
                disabled={exam.submitted}
                placeholder="Type your answer here"
                style={{
                  width: "100%",
                  padding: "8px",
                  fontSize: "16px",
                }}
              />
            </div>
          )}

          {currentQuestion.question_type === "MSQ" &&
            Object.entries(currentQuestion.options).map(([k, v]) => (
              <div key={k}>
                <div className="option">
                  <label>
                    <input
                      type="checkbox"
                      checked={(answers[currentIndex] || []).includes(k)}
                      disabled={exam.submitted}
                      onChange={() => toggleMSQOption(k)}
                    />
                    {` ${k}. ${v}`}
                  </label>
                </div>
              </div>
            ))}

          <div style={{ marginTop: "15px" }}>
            <button
              onClick={() => setCurrentIndex((i) => i - 1)}
              disabled={currentIndex === 0}
            >
              Previous
            </button>

            <button
              onClick={() => setCurrentIndex((i) => i + 1)}
              disabled={currentIndex === exam.questions.length - 1}
              style={{ marginLeft: "10px" }}
            >
              Next
            </button>

            {currentIndex === exam.questions.length - 1 && !exam.submitted && (
              <button onClick={() => finalizeSubmission("manual")}>
                  Submit Exam
              </button>
            )}
          </div>

          {exam.submitted && (
            <div style={{ marginTop: "15px" }}>
              <p class="success">Exam submitted</p>
              <p>
                <strong>Score:</strong> {exam.score} (Auto-graded only)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ExamApplication;

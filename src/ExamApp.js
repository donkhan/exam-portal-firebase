import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  where,
  setDoc,
  getDoc,
  doc,
  updateDoc
} from "firebase/firestore";
import { auth, db } from "./firebase";

function ExamApp() {
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

    const examDocRef = doc(
      db,
      "exams",
      `${storedExamId}_${user.uid}`
    );

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
    if (!examIdInput) {
      setError("Please enter Exam ID");
      return;
    }

    setError("");

    // 1️⃣ Fetch exam metadata
    const metaSnap = await getDocs(
      query(
        collection(db, "exams_meta"),
        where("exam_id", "==", examIdInput)
      )
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

    // 2️⃣ Fetch question bank
    const qSnap = await getDocs(
      query(
        collection(db, "questions"),
        where("course_id", "==", examMeta.course_id)
      )
    );


    let allQuestions = qSnap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));


    // Filter by question type
    if (!examMeta.question_types.includes("ALL")) {
      allQuestions = allQuestions.filter(q =>
        examMeta.question_types.includes(q.question_type)
      );
    }

    // Filter by chapter
    if (!examMeta.chapters.includes("ALL")) {
      allQuestions = allQuestions.filter(q =>
        examMeta.chapters.includes(q.chapter)
      );
    }

    if (allQuestions.length < examMeta.total_questions) {
      setError("Not enough questions available for this exam");
      return;
    }

      const total = examMeta.total_questions;

// Difficulty buckets
const easyQs = allQuestions.filter(q => q.difficulty === "EASY");
const mediumQs = allQuestions.filter(q => q.difficulty === "MEDIUM");
const hardQs = allQuestions.filter(q => q.difficulty === "HARD");

// Target counts
let easyCount = Math.round(total * 0.4);
let mediumCount = Math.round(total * 0.4);
let hardCount = total - easyCount - mediumCount;

// Selection
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

// Fallback
if (selected.length < total) {
  pickFrom(allQuestions, total - selected.length);
}

const selectedQuestions = shuffle(selected);



    // 4️⃣ Create student exam document
    const startTime = Date.now();
    const endTime = startTime + examMeta.duration_minutes * 60 * 1000;

    const examDoc = {
      exam_id: examIdInput,
      course_id: examMeta.course_id,
      user_id: user.uid,
      questions: selectedQuestions,
      answers: {},
      submitted: false,
      started_at: startTime,
      end_at: endTime
    };

    const examDocId = `${examIdInput}_${user.uid}`;

    await setDoc(doc(db, "exams", examDocId), examDoc);

    setExam(examDoc);
    localStorage.setItem("activeExamId", examIdInput);
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
        autoSubmit();
      } else {
        setTimeLeft(Math.floor(remaining / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [exam]);

  /* ================= SCORING ================= */

  function calculateScore() {
  let score = 0;

  exam.questions.forEach((q, index) => {
    const studentAnswer = answers[index];

    // If student did not answer, skip
    if (studentAnswer === undefined || studentAnswer === null) {
      return;
    }

    /* ================= MCQ ================= */
    if (q.question_type === "MCQ") {
      const correct = q.correct_answer || [];

      if (
        Array.isArray(studentAnswer) &&
        studentAnswer.length === 1 &&
        correct.includes(studentAnswer[0])
      ) {
        score += q.marks || 1;
      }
    }

    /* ================= MSQ ================= */
    else if (q.question_type === "MSQ") {
      const correct = q.correct_answer || [];

      if (!Array.isArray(studentAnswer)) return;

      const studentSet = new Set(studentAnswer);
      const correctSet = new Set(correct);

      // STRICT all-or-nothing match
      if (
        studentSet.size === correctSet.size &&
        [...studentSet].every(a => correctSet.has(a))
      ) {
        score += q.marks || 1;
      }
    }

    /* ================= FILL BLANK ================= */
    else if (q.question_type === "FILL_BLANK") {
      if (typeof studentAnswer !== "string") return;

      const correct = q.correct_answer;
      const caseSensitive = q.case_sensitive || false;

      let studentText = studentAnswer.trim();
      let correctText = String(correct).trim();

      if (!caseSensitive) {
        studentText = studentText.toLowerCase();
        correctText = correctText.toLowerCase();
      }

      if (studentText === correctText) {
        score += q.marks || 1;
      }
    }

    /* ================= DESCRIPTIVE ================= */
    else if (q.question_type === "DESCRIPTIVE") {
      // No auto grading
      return;
    }
  });

  return score;
}


  /* ================= ANSWERS ================= */

  const selectMCQ = async (option) => {
    if (exam.submitted) return;

    const newAnswers = {
      ...answers,
      [currentIndex]: [option]
    };

    setAnswers(newAnswers);

    await updateDoc(
      doc(db, "exams", `${exam.exam_id}_${user.uid}`),
      { answers: newAnswers }
    );
  };

  const updateFillBlank = async (value) => {
  if (exam.submitted) return;

  const newAnswers = {
    ...answers,
    [currentIndex]: value
  };

  setAnswers(newAnswers);

  await updateDoc(
    doc(db, "exams", `${exam.exam_id}_${user.uid}`),
    { answers: newAnswers }
  );
};


const toggleMSQOption = async (option) => {
  if (exam.submitted) return;

  const existing = answers[currentIndex] || [];
  let updated;

  if (existing.includes(option)) {
    updated = existing.filter(o => o !== option);
  } else {
    updated = [...existing, option];
  }

  const newAnswers = {
    ...answers,
    [currentIndex]: updated
  };

  setAnswers(newAnswers);

  await updateDoc(
    doc(db, "exams", `${exam.exam_id}_${user.uid}`),
    { answers: newAnswers }
  );
};



  /* ================= SUBMIT ================= */

  async function submitExam() {
    if (!exam || exam.submitted) return;

    const score = calculateScore();

    await updateDoc(
      doc(db, "exams", `${exam.exam_id}_${user.uid}`),
      {
        submitted: true,
        submitted_at: Date.now(),
        score: score
      }
    );

    setExam({
      ...exam,
      submitted: true,
      score: score
    });

    alert("Exam submitted successfully");
    localStorage.removeItem("activeExamId");
  }

  async function autoSubmit() {
    if (!exam || exam.submitted) return;

    const score = calculateScore();

    await updateDoc(
      doc(db, "exams", `${exam.exam_id}_${user.uid}`),
      {
        submitted: true,
        submitted_at: Date.now(),
        score: score
      }
    );

    setExam({
      ...exam,
      submitted: true,
      score: score
    });

    alert("Time is up! Exam auto-submitted.");
  }

  /* ================= UI ================= */

  const currentQuestion = exam?.questions[currentIndex];

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "auto" }}>
      <h2>Student Exam Portal</h2>

      {!user && <button onClick={login}>Login with Google</button>}

      {user && (
        <>
          <p>
            <strong>{user.displayName}</strong><br />
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
          <br /><br />
          <button onClick={joinExam}>Join Exam</button>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
      )}

      {exam && currentQuestion && (
        <div>

          {!exam.submitted && timeLeft !== null && (
            <p style={{ color: "red", fontWeight: "bold" }}>
              Time Left: {Math.floor(timeLeft / 60)}:
              {(timeLeft % 60).toString().padStart(2, "0")}
            </p>
          )}

          <h3>
            Question {currentIndex + 1} of {exam.questions.length}
          </h3>

          <p>{currentQuestion.question_text}</p>

          {currentQuestion.question_type === "MCQ" && (
            Object.entries(currentQuestion.options).map(([k, v]) => (
              <div key={k}>
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
            ))
          )}


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
        fontSize: "16px"
      }}
    />
  </div>
)}

    {currentQuestion.question_type === "MSQ" && (
  Object.entries(currentQuestion.options).map(([k, v]) => (
    <div key={k}>
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
  ))
)}




          <div style={{ marginTop: "15px" }}>
            <button
              onClick={() => setCurrentIndex(i => i - 1)}
              disabled={currentIndex === 0}
            >
              Previous
            </button>

            <button
              onClick={() => setCurrentIndex(i => i + 1)}
              disabled={currentIndex === exam.questions.length - 1}
              style={{ marginLeft: "10px" }}
            >
              Next
            </button>

            {currentIndex === exam.questions.length - 1 && !exam.submitted && (
              <button
                onClick={submitExam}
                style={{
                  marginLeft: "10px",
                  background: "green",
                  color: "white"
                }}
              >
                Submit Exam
              </button>
            )}
          </div>

          {exam.submitted && (
            <div style={{ marginTop: "15px" }}>
              <p style={{ color: "green", fontWeight: "bold" }}>
                Exam submitted
              </p>
              <p>
                <strong>Score:</strong>{" "}
                {exam.score} (Auto-graded only)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ExamApp;

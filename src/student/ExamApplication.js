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
    localStorage.removeItem("activeExamId");
  };

  /* ================= RESUME ================= */

  useEffect(() => {
    if (!user) return;

    async function resumeExam() {
      const stored = localStorage.getItem("activeExamId");
      if (!stored) return;

      const ref = doc(db, "exams", `${stored}_${user.uid}`);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        localStorage.removeItem("activeExamId");
        return;
      }

      const data = snap.data();
      if (data.submitted) {
        localStorage.removeItem("activeExamId");
        return;
      }

      setExam(data);
      setAnswers(data.answers || {});
    }

    resumeExam();
  }, [user]);

  /* ================= HELPERS ================= */

  function shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
  }

  /* ================= JOIN EXAM ================= */

  async function joinExam() {
    if (!user) return setError("Please login");
    if (!examIdInput) return setError("Enter Exam ID");

    setError("");

    const metaSnap = await getDocs(
      query(collection(db, "exams_meta"), where("exam_id", "==", examIdInput)),
    );

    if (metaSnap.empty) return setError("Invalid Exam ID");

    const examMeta = metaSnap.docs[0].data();
    if (!examMeta.active) return setError("Exam not active");

    /* 🔐 SECURITY: FETCH QUESTIONS BUT STRIP ANSWERS */
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

    if (allQuestions.length < examMeta.total_questions)
      return setError("Not enough questions");

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
      started_at: start,
      end_at: end,
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

    const t = setInterval(() => {
      const remaining = exam.end_at - Date.now();
      if (remaining <= 0) {
        clearInterval(t);
        finalizeSubmission("auto");
      } else {
        setTimeLeft(Math.floor(remaining / 1000));
      }
    }, 1000);

    return () => clearInterval(t);
  }, [exam]);

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

  /* ================= GRADING (POST SUBMIT ONLY) ================= */

  async function gradeExam(latestExam) {
    const qSnap = await getDocs(
      query(
        collection(db, "questions"),
        where("course_id", "==", latestExam.course_id),
      ),
    );

    const answerMap = {};
    qSnap.docs.forEach((d) => {
      answerMap[d.id] = d.data();
    });

    let score = 0;

    latestExam.questions.forEach((q, idx) => {
      const student = latestExam.answers[idx];
      if (student === undefined) return;

      const correct = answerMap[q.id]?.correct_answer;

      if (q.question_type === "MCQ") {
        if (correct.includes(student[0])) score += q.marks || 1;
      } else if (q.question_type === "MSQ") {
        const c = new Set(correct);
        const s = new Set(student || []);
        if (c.size === s.size && [...c].every((x) => s.has(x)))
          score += q.marks || 1;
      } else if (q.question_type === "FILL_BLANK") {
        if (
          String(student).trim().toLowerCase() ===
          String(correct).trim().toLowerCase()
        )
          score += q.marks || 1;
      }
    });

    return score;
  }

  async function finalizeSubmission(reason) {
    if (!exam || exam.submitted) return;

    const ref = doc(db, "exams", `${exam.exam_id}_${user.uid}`);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const latest = snap.data();
    const score = await gradeExam(latest);

    await updateDoc(ref, {
      submitted: true,
      submitted_at: Date.now(),
      submission_type: reason,
      score: score,
    });

    setExam({ ...latest, submitted: true, score });
    localStorage.removeItem("activeExamId");
    alert(reason === "auto" ? "Time up! Auto-submitted." : "Exam submitted.");
  }

  /* ================= UI ================= */

  const q = exam?.questions[currentIndex];

  return (
    <div className="app-container">
      <h2 align="center">Online Exam</h2>

      {!user && <button onClick={login}>Login with Google</button>}
      {user && <button onClick={logout}>Logout</button>}

      {!exam && user && (
        <>
          <input
            value={examIdInput}
            onChange={(e) => setExamIdInput(e.target.value)}
          />
          <button onClick={joinExam}>Join Exam</button>
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
            Object.entries(q.options).map(([k, v]) => (
              <label key={k}>
                <input
                  type="radio"
                  checked={answers[currentIndex]?.[0] === k}
                  onChange={() => selectMCQ(k)}
                />
                {k}. {v}
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

          {currentIndex === exam.questions.length - 1 && !exam.submitted && (
            <button onClick={() => finalizeSubmission("manual")}>Submit</button>
          )}

          {exam.submitted && (
            <p>
              <strong>Score:</strong> {exam.score}
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default ExamApplication;

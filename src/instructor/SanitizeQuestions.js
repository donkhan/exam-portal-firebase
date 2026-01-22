import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate, useParams } from "react-router-dom";

import ConflictResolutionRenderer from "./ConflictResolutionRenderer";
import QuestionFlowRenderer from "./QuestionFlowRenderer";

function SanitizeQuestions() {
  const navigate = useNavigate();
  const { courseId } = useParams(); // ✅ ROUTE PARAM

  /* ===================== CONFIG ===================== */

  const DEV_MODE = false;

  const AI_FUNCTION_URL =
    "https://us-central1-exam-portal-3a4ac.cloudfunctions.net/checkAnswersWithAI";

  /* ===================== STATE ===================== */

  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");

  // [{ question_id, question_text, instructor_answer }]
  const [buffer, setBuffer] = useState([]);

  const [aiResults, setAiResults] = useState(null);
  const [resolved, setResolved] = useState({});
  const [loading, setLoading] = useState(true);
  const [checkingAI, setCheckingAI] = useState(false);

  /* ===================== LOAD QUESTIONS ===================== */

  useEffect(() => {
    if (!courseId) return;
    loadUnsanitized();
  }, [courseId]);

  const loadUnsanitized = async () => {
    setLoading(true);

    const q = query(
      collection(db, "questions"),
      where("course_id", "==", courseId)
    );

    const snap = await getDocs(q);

    const all = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    setQuestions(all.filter((q) => q.is_sanitized !== true));
    setIndex(0);
    setLoading(false);
  };

  /* ===================== AI ===================== */

  const callAIBackend = async (payload) => {
    if (DEV_MODE) {
      return {
        results: payload.map((item, idx) => ({
          question_id: item.question_id,
          instructor_answer: item.instructor_answer,
          ai_answer: idx % 2 === 0 ? item.instructor_answer : "23",
          agrees: idx % 2 === 0,
          reasoning:
            idx % 2 === 0
              ? "Instructor answer accepted (DEV MODE)"
              : "AI computed a different answer (DEV MODE)",
        })),
      };
    }

    const res = await fetch(AI_FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: payload }),
    });

    if (!res.ok) {
      throw new Error(`AI check failed: ${res.status}`);
    }

    return await res.json();
  };

  const runAICheck = async () => {
    if (buffer.length === 0) {
      alert("No answers collected yet");
      return;
    }

    try {
      setCheckingAI(true);
      const aiResponse = await callAIBackend(buffer);
      setAiResults(aiResponse);
    } catch (err) {
      alert(err.message || "AI check failed");
    } finally {
      setCheckingAI(false);
    }
  };

  /* ===================== GUARDS ===================== */

  if (!courseId) {
    return (
      <Centered>
        <p>Invalid course.</p>
        <button onClick={() => navigate("/instructor/manage-courses")}>
          ⬅ Back to Courses
        </button>
      </Centered>
    );
  }

  if (loading) {
    return (
      <Centered>
        <p>Loading questions…</p>
      </Centered>
    );
  }

  if (questions.length === 0) {
    return (
      <Centered>
        <h3>No unsanitized questions 🎉</h3>
        <button
          onClick={() =>
            navigate(`/instructor/manage-courses`)
          }
        >
          ⬅ Back to Courses
        </button>
      </Centered>
    );
  }

  /* ===================== CONFLICT RESOLUTION ===================== */

  if (aiResults) {
    return (
      <CenteredCard>
        <ConflictResolutionRenderer
          aiResults={aiResults}
          buffer={buffer}
          resolved={resolved}
          setResolved={setResolved}
          onDone={async () => {
            try {
              const finalUpdates = aiResults.results.map((r) => {
                if (r.agrees) {
                  return {
                    question_id: r.question_id,
                    final_answer: r.instructor_answer,
                  };
                }

                const decision = resolved[r.question_id];
                if (!decision) {
                  throw new Error("Resolve all conflicts first.");
                }

                return {
                  question_id: r.question_id,
                  final_answer: decision.final_answer,
                };
              });

              for (const item of finalUpdates) {
                await updateDoc(doc(db, "questions", item.question_id), {
                  correct_answer: item.final_answer,
                  is_sanitized: true,
                  sanitizedAt: new Date(),
                });
              }

              alert("✅ Questions sanitized successfully");

              setAiResults(null);
              setResolved({});
              setBuffer([]);

              navigate("/instructor/manage-courses");
            } catch (err) {
              alert(err.message || "Save failed");
            }
          }}
          onBack={() => {
            setAiResults(null);
            setResolved({});
          }}
        />
      </CenteredCard>
    );
  }

  /* ===================== QUESTION FLOW ===================== */

  const current = questions[index] || null;

  return (
    <CenteredCard>
      <QuestionFlowRenderer
        current={current}
        index={index}
        total={questions.length}
        answer={answer}
        bufferLength={buffer.length}
        checkingAI={checkingAI}
        onAnswerChange={setAnswer}
        onBack={() => navigate("/instructor/manage-courses")}
        onNext={() => {
          if (!answer) {
            alert("Please enter an answer or skip.");
            return;
          }

          setBuffer((prev) => [
            ...prev,
            {
              question_id: current.id,
              question_text: current.question_text,
              instructor_answer: answer,
            },
          ]);

          setAnswer("");
          setIndex((i) => i + 1);
        }}
        onSkip={() => {
          setAnswer("");
          setIndex((i) => i + 1);
        }}
        onRunAICheck={runAICheck}
      />
    </CenteredCard>
  );
}

/* ===================== LAYOUT HELPERS ===================== */

const Centered = ({ children }) => (
  <div style={styles.pageCenter}>{children}</div>
);

const CenteredCard = ({ children }) => (
  <div style={styles.pageCenter}>
    <div style={styles.card}>{children}</div>
  </div>
);

const styles = {
  pageCenter: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f4f6f8",
    padding: "20px",
  },
  card: {
    width: "100%",
    maxWidth: "900px",
    background: "#fff",
    borderRadius: "8px",
    padding: "24px",
    boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
  },
};

export default SanitizeQuestions;

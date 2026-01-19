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
import { useNavigate, useLocation } from "react-router-dom";

function SanitizeQuestions() {
  const navigate = useNavigate();
  const location = useLocation();

  /* ===================== CONFIG ===================== */

  const DEV_MODE = false;

  const AI_FUNCTION_URL =
    "https://us-central1-exam-portal-3a4ac.cloudfunctions.net/checkAnswersWithAI";

  /* ===================== STATE ===================== */

  const courseId = location.state?.courseId;

  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");

  // Buffer = answers entered by instructor
  // [{ question_id, question_text, instructor_answer }]
  const [buffer, setBuffer] = useState([]);

  const [aiResults, setAiResults] = useState(null);
  const [resolved, setResolved] = useState({});
  const [loading, setLoading] = useState(true);

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

    const unsanitized = all.filter((q) => q.is_sanitized !== true);

    setQuestions(unsanitized);
    setIndex(0);
    setLoading(false);
  };

  /* ===================== AI (MOCKED IN DEV) ===================== */

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

  /* ===================== GUARDS ===================== */

  if (!courseId) {
    return (
      <div style={{ padding: "20px" }}>
        <p>Course not selected.</p>
        <button onClick={() => navigate(-1)}>⬅ Back</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: "20px" }}>
        <p>Loading questions…</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div style={{ padding: "20px" }}>
        <h3>No unsanitized questions 🎉</h3>
        <button onClick={() => navigate(-1)}>⬅ Back</button>
      </div>
    );
  }

  /* ===================== CONFLICT RESOLUTION ===================== */

  if (aiResults) {
    // Lookup map to show question text during conflicts
    const questionMap = Object.fromEntries(
      buffer.map((b) => [b.question_id, b.question_text])
    );

    return (
      <div style={{ padding: "20px" }}>
        <h2>AI Conflict Resolution</h2>

        {aiResults.results.map((r, idx) => {
          const decision = resolved[r.question_id];

          return (
            <div
              key={r.question_id}
              style={{
                border: "1px solid #ccc",
                padding: "12px",
                marginBottom: "12px",
                background: r.agrees ? "#e8f5e9" : "#fff3e0",
              }}
            >
              <h4>Question {idx + 1}</h4>

              {/* QUESTION TEXT */}
              <p
                style={{
                  marginTop: "8px",
                  padding: "8px",
                  background: "#f9f9f9",
                  borderLeft: "4px solid #1976d2",
                  fontWeight: "500",
                }}
              >
                {questionMap[r.question_id]}
              </p>

              <p>
                <strong>Instructor Answer:</strong>{" "}
                {r.instructor_answer}
              </p>

              <p>
                <strong>AI Answer:</strong> {r.ai_answer}
              </p>

              <p>
                <em>{r.reasoning}</em>
              </p>

              {r.agrees ? (
                <p style={{ color: "green" }}>
                  ✅ AI agrees with instructor
                </p>
              ) : decision ? (
                <p style={{ color: "blue" }}>
                  ✔ Final Answer Selected ({decision.source})
                </p>
              ) : (
                <>
                  <button
                    onClick={() =>
                      setResolved((prev) => ({
                        ...prev,
                        [r.question_id]: {
                          final_answer: r.instructor_answer,
                          source: "instructor",
                        },
                      }))
                    }
                  >
                    ✅ Accept Instructor
                  </button>

                  <button
                    style={{ marginLeft: "10px" }}
                    onClick={() =>
                      setResolved((prev) => ({
                        ...prev,
                        [r.question_id]: {
                          final_answer: r.ai_answer,
                          source: "ai",
                        },
                      }))
                    }
                  >
                    🤖 Accept AI
                  </button>
                </>
              )}
            </div>
          );
        })}

        <hr />

        <button
          onClick={async () => {
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
                  throw new Error(
                    "Please resolve all conflicts before saving."
                  );
                }

                return {
                  question_id: r.question_id,
                  final_answer: decision.final_answer,
                };
              });

              for (const item of finalUpdates) {
                await updateDoc(
                  doc(db, "questions", item.question_id),
                  {
                    correct_answer: item.final_answer,
                    is_sanitized: true,
                    sanitizedAt: new Date(),
                  }
                );
              }

              alert("✅ Questions sanitized successfully");

              setAiResults(null);
              setResolved({});
              setBuffer([]);

              navigate(-1);
            } catch (err) {
              alert(err.message || "Failed to save sanitized answers");
            }
          }}
        >
          ✅ Done & Save
        </button>

        <button
          style={{ marginLeft: "10px" }}
          onClick={() => {
            setAiResults(null);
            setResolved({});
          }}
        >
          ⬅ Back
        </button>
      </div>
    );
  }

  /* ===================== QUESTION FLOW ===================== */

  const current = questions[index] || null;

  if (!current) {
    return (
      <div style={{ padding: "20px" }}>
        <button onClick={() => navigate(-1)}>⬅ Back</button>

        <h3>Reached end of questions</h3>

        <button
          onClick={async () => {
            if (buffer.length === 0) {
              alert("No answers collected yet");
              return;
            }

            const aiResponse = await callAIBackend(buffer);
            if (!aiResponse) return;
            setAiResults(aiResponse);
          }}
        >
          🤖 Check with AI ({buffer.length})
        </button>
      </div>
    );
  }

  /* ===================== MAIN INPUT UI ===================== */

  return (
    <div style={{ padding: "20px" }}>
      <button onClick={() => navigate(-1)}>⬅ Back</button>

      <h3>
        Question {index + 1} of {questions.length}
      </h3>

      <p style={{ marginTop: "10px" }}>
        <strong>{current.question_text}</strong>
      </p>

      <input
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Enter answer"
        style={{ width: "320px", marginTop: "8px" }}
      />

      <div style={{ marginTop: "14px" }}>
        <button
          onClick={() => {
            if (!answer) {
              alert("Please enter an answer");
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

            if (index < questions.length - 1) {
              setIndex(index + 1);
            } else {
              setIndex(questions.length);
            }
          }}
        >
          ▶ Next
        </button>

        <button
          style={{ marginLeft: "10px" }}
          onClick={async () => {
            if (buffer.length === 0) {
              alert("No answers collected yet");
              return;
            }

            const aiResponse = await callAIBackend(buffer);
            if (!aiResponse) return;

            setAiResults(aiResponse);
          }}
        >
          🤖 Check with AI ({buffer.length})
        </button>
      </div>
    </div>
  );
}

export default SanitizeQuestions;

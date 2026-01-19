import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate, useLocation } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";


function SanitizeQuestions() {
  const navigate = useNavigate();
  const location = useLocation();

  /* ===================== CONFIG ===================== */

  const DEV_MODE =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";


  const AI_FUNCTION_URL =
    "https://us-central1-exam-portal-3a4ac.cloudfunctions.net/checkAnswersWithAI";

  /* ===================== STATE ===================== */

  const courseId = location.state?.courseId;

  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");

  // buffer = answers entered by teacher
  const [buffer, setBuffer] = useState([]);
  // [{ question_id, question_text, teacher_answer }]

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

  /* ===================== AI (MOCKED) ===================== */

  const callAIBackend = async (payload) => {
    if (DEV_MODE) {
      console.log("DEV MODE: mocked AI response");
      console.log("Payload:", payload);

      return {
        results: payload.map((item, idx) => ({
          question_id: item.question_id,
          teacher_answer: item.teacher_answer,
          ai_answer: idx % 2 === 0 ? item.teacher_answer : "23",
          agrees: idx % 2 === 0,
          reasoning:
            idx % 2 === 0
              ? "Teacher answer accepted (DEV MODE)"
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

  /* ===================== CONFLICT RESOLUTION (HIGH PRIORITY) ===================== */

  if (aiResults) {
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

              <p>
                <strong>Teacher Answer:</strong> {r.teacher_answer}
              </p>

              <p>
                <strong>AI Answer:</strong> {r.ai_answer}
              </p>

              <p>
                <em>{r.reasoning}</em>
              </p>

              {r.agrees ? (
                <p style={{ color: "green" }}>
                  ✅ AI agrees with teacher
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
                          final_answer: r.teacher_answer,
                          source: "teacher",
                        },
                      }))
                    }
                  >
                    ✅ Accept Teacher
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
      // Build final answers list
      const finalUpdates = aiResults.results.map((r) => {
        // If AI agrees, auto-accept teacher
        if (r.agrees) {
          return {
            question_id: r.question_id,
            final_answer: r.teacher_answer,
          };
        }

        // Conflict: must be resolved by teacher
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

      // Save each question
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

      // Cleanup state
      setAiResults(null);
      setResolved({});
      setBuffer([]);

      // Navigate back
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
                teacher_answer: answer,
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

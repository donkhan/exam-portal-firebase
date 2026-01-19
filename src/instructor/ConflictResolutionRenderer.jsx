import React from "react";

function ConflictResolutionRenderer({
  aiResults,
  buffer,
  resolved,
  setResolved,
  onDone,
  onBack,
}) {
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
              <strong>Instructor Answer:</strong> {r.instructor_answer}
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

      <button onClick={onDone}>✅ Done & Save</button>

      <button style={{ marginLeft: "10px" }} onClick={onBack}>
        ⬅ Back
      </button>
    </div>
  );
}

export default ConflictResolutionRenderer;

import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * SingleQuestionAdd
 * ------------------
 * Handles:
 * - UI for adding a single question
 * - Validation
 * - Firestore insert
 */
function SingleQuestionAdd({ selectedCourse, onAfterAdd }) {
  const [showForm, setShowForm] = useState(false);

  const [newQuestion, setNewQuestion] = useState({
    chapter: "",
    difficulty: "EASY",
    question_type: "MCQ",
    question_text: "",
    options: { A: "", B: "", C: "", D: "" },
    correct_answer: [],
    marks: 1,
  });

  const resetForm = () => {
    setNewQuestion({
      chapter: "",
      difficulty: "EASY",
      question_type: "MCQ",
      question_text: "",
      options: { A: "", B: "", C: "", D: "" },
      correct_answer: [],
      marks: 1,
    });
  };

  const saveNewQuestion = async () => {
    if (!selectedCourse) {
      alert("Please select a course first");
      return;
    }

    if (
      !newQuestion.chapter ||
      !newQuestion.question_text ||
      !newQuestion.marks
    ) {
      alert("Chapter, question text, and marks are required");
      return;
    }

    try {
      await addDoc(collection(db, "questions"), {
        course_id: selectedCourse,
        chapter: newQuestion.chapter,
        difficulty: newQuestion.difficulty,
        question_type: newQuestion.question_type,
        question_text: newQuestion.question_text,
        options:
          newQuestion.question_type === "MCQ" ? newQuestion.options : {},
        correct_answer: newQuestion.correct_answer,
        marks: newQuestion.marks,
        created_at: Date.now(),
      });

      resetForm();
      setShowForm(false);

      if (onAfterAdd) {
        onAfterAdd();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to add question");
    }
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      <button onClick={() => setShowForm(true)}>➕ Add Question</button>

      {showForm && (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "6px",
            padding: "16px",
            marginTop: "10px",
            background: "#fafafa",
          }}
        >
          <h4 style={{ marginTop: 0 }}>➕ Add Question</h4>

          {/* META */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <input
              placeholder="Chapter (e.g. Unit-1)"
              value={newQuestion.chapter}
              onChange={(e) =>
                setNewQuestion({
                  ...newQuestion,
                  chapter: e.target.value,
                })
              }
              style={{ flex: 1 }}
            />

            <select
              value={newQuestion.question_type}
              onChange={(e) =>
                setNewQuestion({
                  ...newQuestion,
                  question_type: e.target.value,
                })
              }
            >
              <option value="MCQ">MCQ</option>
              <option value="FILL_BLANK">Fill Blank</option>
            </select>

            <input
              type="number"
              min="1"
              value={newQuestion.marks}
              onChange={(e) =>
                setNewQuestion({
                  ...newQuestion,
                  marks: Number(e.target.value),
                })
              }
              style={{ width: "80px" }}
            />
          </div>

          {/* QUESTION TEXT */}
          <textarea
            placeholder="Question text"
            rows={3}
            style={{ width: "100%", marginBottom: "10px" }}
            value={newQuestion.question_text}
            onChange={(e) =>
              setNewQuestion({
                ...newQuestion,
                question_text: e.target.value,
              })
            }
          />

          {/* MCQ OPTIONS */}
          {newQuestion.question_type === "MCQ" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
                marginBottom: "10px",
              }}
            >
              {["A", "B", "C", "D"].map((k) => (
                <input
                  key={k}
                  placeholder={`Option ${k}`}
                  value={newQuestion.options[k]}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      options: {
                        ...newQuestion.options,
                        [k]: e.target.value,
                      },
                    })
                  }
                />
              ))}

              <input
                placeholder="Correct answer (e.g. A)"
                value={newQuestion.correct_answer.join(",")}
                onChange={(e) =>
                  setNewQuestion({
                    ...newQuestion,
                    correct_answer: [e.target.value.trim()],
                  })
                }
                style={{ gridColumn: "1 / -1" }}
              />
            </div>
          )}

          {/* ACTIONS */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
            >
              Cancel
            </button>

            <button
              onClick={saveNewQuestion}
              style={{
                background: "#1976d2",
                color: "white",
                border: "none",
                padding: "6px 12px",
                cursor: "pointer",
              }}
            >
              Save Question
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SingleQuestionAdd;

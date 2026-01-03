import React from "react";

function QuestionsTable({
  loading,
  questions,
  editingId,
  editData,
  setEditData,
  startEdit,
  cancelEdit,
  saveEdit,
  deleteSingleQuestion,
}) {
  if (loading) {
    return <p>Loading questions...</p>;
  }

  if (!loading && questions.length === 0) {
    return <p>No questions found for this course.</p>;
  }

  return (
    <>
      {/* 🔢 Question Count */}
      <div
        style={{
          marginBottom: "10px",
          fontWeight: "bold",
          background: "#eef3ff",
          padding: "6px 10px",
          borderRadius: "4px",
          display: "inline-block",
        }}
      >
        📊 Total Questions: {questions.length}
      </div>

      <table
        border="1"
        cellPadding="8"
        style={{ borderCollapse: "collapse", width: "100%" }}
      >
        <thead style={{ background: "#f0f0f0" }}>
          <tr>
            <th>#</th>
            <th>Chapter</th>
            <th>Difficulty</th>
            <th>Type</th>
            <th>Marks</th>
            <th>Question</th>
            <th>Options</th>
            <th>Correct</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {questions.map((q, index) => (
            <tr key={q.id}>
              <td>{index + 1}</td>

              <td>
                {editingId === q.id ? (
                  <input
                    value={editData.chapter}
                    onChange={(e) =>
                      setEditData({ ...editData, chapter: e.target.value })
                    }
                  />
                ) : (
                  q.chapter
                )}
              </td>

              <td>
                {editingId === q.id ? (
                  <select
                    value={editData.difficulty}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        difficulty: e.target.value,
                      })
                    }
                  >
                    <option value="">-- Select --</option>
                    <option value="EASY">EASY</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HARD">HARD</option>
                  </select>
                ) : q.difficulty ? (
                  q.difficulty
                ) : (
                  <em>NA</em>
                )}
              </td>

              <td>{q.question_type}</td>

              <td>
                {editingId === q.id ? (
                  <input
                    type="number"
                    value={editData.marks}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        marks: Number(e.target.value),
                      })
                    }
                    style={{ width: "60px" }}
                  />
                ) : (
                  q.marks
                )}
              </td>

              <td>
                {editingId === q.id ? (
                  <textarea
                    value={editData.question_text}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        question_text: e.target.value,
                      })
                    }
                    rows={3}
                    style={{ width: "100%" }}
                  />
                ) : (
                  q.question_text
                )}
              </td>

              <td>
                {q.options && Object.keys(q.options).length > 0 ? (
                  Object.entries(q.options).map(([k, v]) => (
                    <div key={k}>
                      <strong>{k}.</strong> {v}
                    </div>
                  ))
                ) : (
                  <em>N/A</em>
                )}
              </td>

              <td>
                {editingId === q.id ? (
                  q.question_type === "DESCRIPTIVE" ? (
                    <em>Manual</em>
                  ) : (
                    <input
                      placeholder={
                        q.question_type === "MCQ" ? "e.g. C" : "e.g. A,C"
                      }
                      value={
                        Array.isArray(editData.correct_answer)
                          ? editData.correct_answer.join(",")
                          : editData.correct_answer
                      }
                      onChange={(e) => {
                        const val = e.target.value
                          .toUpperCase()
                          .replace(/\s/g, "");

                        setEditData({
                          ...editData,
                          correct_answer: Array.isArray(q.correct_answer)
                            ? val.split(",").filter(Boolean)
                            : val,
                        });
                      }}
                      style={{ width: "80px" }}
                    />
                  )
                ) : Array.isArray(q.correct_answer) ? (
                  q.correct_answer.join(", ")
                ) : (
                  q.correct_answer
                )}
              </td>

              <td>
                {editingId === q.id ? (
                  <>
                    <button onClick={() => saveEdit(q.id)}>Save</button>
                    <hr />
                    <button onClick={cancelEdit}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(q)}>Edit</button>
                    <hr />
                    <button
                      onClick={() => deleteSingleQuestion(q.id)}
                      style={{ color: "red" }}
                    >
                      Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export default QuestionsTable;

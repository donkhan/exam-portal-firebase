import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

const PAGE_SIZE = 10;

function QuestionsTable({ selectedCourseId }) {
  /* ===================== STATE ===================== */

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const [firstDoc, setFirstDoc] = useState(null);
  const [lastDoc, setLastDoc] = useState(null);
  const [pageStack, setPageStack] = useState([]);

  /* Edit state */
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  /* ===================== EFFECT ===================== */

  useEffect(() => {
    if (!selectedCourseId) return;
    fetchFirstPage();
  }, [selectedCourseId]);

  /* ===================== FIRESTORE FETCH ===================== */

  const fetchFirstPage = async () => {
    setLoading(true);

    const q = query(
      collection(db, "questions"),
      where("course_id", "==", selectedCourseId),
      orderBy("__name__"),
      limit(PAGE_SIZE),
    );

    const snapshot = await getDocs(q);
    const docs = snapshot.docs;

    setQuestions(docs.map((d) => ({ id: d.id, ...d.data() })));
    setFirstDoc(docs[0] || null);
    setLastDoc(docs[docs.length - 1] || null);
    setPageStack([]);

    setLoading(false);
  };

  const fetchNextPage = async () => {
    if (!lastDoc) return;

    setLoading(true);
    setPageStack((prev) => [...prev, firstDoc]);

    const q = query(
      collection(db, "questions"),
      where("course_id", "==", selectedCourseId),
      orderBy("__name__"),
      startAfter(lastDoc),
      limit(PAGE_SIZE),
    );

    const snapshot = await getDocs(q);
    const docs = snapshot.docs;

    if (!docs.length) {
      setLoading(false);
      return;
    }

    setQuestions(docs.map((d) => ({ id: d.id, ...d.data() })));
    setFirstDoc(docs[0]);
    setLastDoc(docs[docs.length - 1]);

    setLoading(false);
  };

  const fetchPrevPage = async () => {
    if (!pageStack.length) return;

    setLoading(true);

    const prevCursor = pageStack[pageStack.length - 1];
    const newStack = pageStack.slice(0, -1);

    const q = query(
      collection(db, "questions"),
      where("course_id", "==", selectedCourseId),
      orderBy("__name__"),
      startAfter(prevCursor),
      limit(PAGE_SIZE),
    );

    const snapshot = await getDocs(q);
    const docs = snapshot.docs;

    setQuestions(docs.map((d) => ({ id: d.id, ...d.data() })));
    setFirstDoc(docs[0]);
    setLastDoc(docs[docs.length - 1]);
    setPageStack(newStack);

    setLoading(false);
  };

  /* ===================== EDIT / DELETE ===================== */

  const startEdit = (q) => {
    setEditingId(q.id);
    setEditData({ ...q });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async (id) => {
    await updateDoc(doc(db, "questions", id), editData);
    cancelEdit();
    fetchFirstPage();
  };

  const deleteSingleQuestion = async (id) => {
    if (!window.confirm("Delete this question?")) return;
    await deleteDoc(doc(db, "questions", id));
    fetchFirstPage();
  };

  /* ===================== RENDER ===================== */

  if (loading) return <p>Loading questions...</p>;
  if (!loading && questions.length === 0)
    return <p>No questions found for this course.</p>;

  return (
    <>
      {/* 🔁 Paging Controls */}
      <div style={{ marginBottom: "10px", display: "flex", gap: "10px" }}>
        <button onClick={fetchPrevPage} disabled={!pageStack.length}>
          ◀ Prev
        </button>

        <strong>Page {pageStack.length + 1}</strong>

        <button onClick={fetchNextPage} disabled={questions.length < PAGE_SIZE}>
          Next ▶
        </button>
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
                    <option value="EASY">EASY</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HARD">HARD</option>
                  </select>
                ) : (
                  q.difficulty
                )}
              </td>

              <td>
                {editingId === q.id ? (
                  <select
                    value={editData.question_type}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        question_type: e.target.value,
                      })
                    }
                  >
                    <option value="MCQ">MCQ</option>
                    <option value="MSQ">MSQ</option>
                    <option value="FILL_BLANK">FILL_BLANK</option>
                    <option value="DESCRIPTIVE">DESCRIPTIVE</option>
                  </select>
                ) : (
                  q.question_type
                )}
              </td>

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
                {editingId === q.id ? (
                  editData.options &&
                  Object.keys(editData.options).length > 0 ? (
                    Object.entries(editData.options).map(([key, value]) => (
                      <div key={key} style={{ marginBottom: "4px" }}>
                        <strong>{key}.</strong>{" "}
                        <input
                          type="text"
                          value={value}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              options: {
                                ...editData.options,
                                [key]: e.target.value,
                              },
                            })
                          }
                          style={{ width: "90%" }}
                        />
                      </div>
                    ))
                  ) : (
                    <em>No options</em>
                  )
                ) : q.options && Object.keys(q.options).length > 0 ? (
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
                  q.question_type === "FILL_BLANK" ? (
                    <em>Manual</em>
                  ) : (
                    <input
                      value={
                        Array.isArray(editData.correct_answer)
                          ? editData.correct_answer.join(",")
                          : editData.correct_answer || ""
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

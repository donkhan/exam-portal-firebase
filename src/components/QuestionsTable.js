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
import { useNavigate } from "react-router-dom";

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
  const [pageSize, setPageSize] = useState(10);
  const navigate = useNavigate();

  /* ===================== EFFECT ===================== */

  useEffect(() => {
    if (!selectedCourseId) return;
    fetchFirstPage();
  }, [selectedCourseId, pageSize]); // ✅ pageSize drives reload

  /* ===================== FIRESTORE FETCH ===================== */

  const fetchFirstPage = async () => {
    setLoading(true);

    const q = query(
      collection(db, "questions"),
      where("course_id", "==", selectedCourseId),
      orderBy("__name__"),
      limit(pageSize),
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
      limit(pageSize),
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
      limit(pageSize),
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
    const payload = {
      question_text: editData.question_text,
      correct_answer: editData.correct_answer,
      editedAt: new Date(),
    };

    await updateDoc(doc(db, "questions", id), payload);

    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...payload } : q)),
    );
    cancelEdit();
  };

  const markSanitized = async (q) => {
    const payload = {
      is_sanitized: true,
      sanitizedAt: new Date(),
    };

    await updateDoc(doc(db, "questions", q.id), payload);

    setQuestions((prev) =>
      prev.map((item) => (item.id === q.id ? { ...item, ...payload } : item)),
    );
  };

  const deleteSingleQuestion = async (id) => {
    if (!window.confirm("Delete this question with id " + id + " ?")) return;
    await deleteDoc(doc(db, "questions", id));
    fetchFirstPage();
  };

  const PagingControls = () => (
    <div
      style={{
        margin: "10px 0",
        display: "flex",
        gap: "10px",
        alignItems: "center",
      }}
    >
      <button onClick={fetchPrevPage} disabled={!pageStack.length}>
        ◀ Prev
      </button>

      <strong>Page {pageStack.length + 1}</strong>

      <button onClick={fetchNextPage} disabled={questions.length < pageSize}>
        Next ▶
      </button>

      <span style={{ marginLeft: "20px" }}>
        Page size:{" "}
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPageStack([]);
          }}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={50}>100</option>
        </select>
      </span>
    </div>
  );

  /* ===================== RENDER ===================== */

  if (loading) return <p>Loading questions...</p>;
  if (!loading && questions.length === 0)
    return <p>No questions found for this course.</p>;

  return (
    <>
      <button
        onClick={() =>
          navigate("/sanitize", {
            state: { courseId: selectedCourseId },
          })
        }
        style={{
          background: "#1976d2",
          color: "white",
          padding: "6px 12px",
          borderRadius: "4px",
          border: "none",
          cursor: "pointer",
          marginBottom: "10px",
        }}
      >
        🧼 Sanitize
      </button>

      <PagingControls />

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
          {questions.map((q, index) => {
            const isEditing = editingId === q.id;

            return (
              <tr key={q.id}>
                <td>
                  {index + 1}
                  {q.is_sanitized && (
                    <span
                      title="Sanitized"
                      style={{ color: "green", marginLeft: "6px" }}
                    >
                      ✔
                    </span>
                  )}
                </td>

                <td>{q.chapter}</td>
                <td>{q.difficulty || <em>NA</em>}</td>
                <td>{q.question_type}</td>
                <td>{q.marks}</td>

                <td>
                  {isEditing ? (
                    <textarea
                      value={editData.question_text || ""}
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

                {/* ✅ FIXED JSX TERNARY */}
                <td>
                  {isEditing ? (
                    q.options && Object.keys(q.options).length > 0 ? (
                      <select
                        value={editData.correct_answer || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            correct_answer: e.target.value,
                          })
                        }
                      >
                        <option value="">-- select --</option>
                        {Object.keys(q.options).map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={editData.correct_answer || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            correct_answer: e.target.value,
                          })
                        }
                      />
                    )
                  ) : Array.isArray(q.correct_answer) ? (
                    q.correct_answer.join(", ")
                  ) : (
                    q.correct_answer || <em>N/A</em>
                  )}
                </td>

                <td>
                  {isEditing ? (
                    <>
                      <button onClick={() => saveEdit(q.id)}>✔ Save</button>
                      <br />
                      <button onClick={cancelEdit}>✖ Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(q)}>✏️ Edit</button>
                      {!q.is_sanitized && (
                        <>
                          <br />
                          <button
                            onClick={() => markSanitized(q)}
                            style={{ fontSize: "12px", marginTop: "4px" }}
                          >
                            🧼 Sanitize
                          </button>
                        </>
                      )}
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
            );
          })}
        </tbody>
      </table>

      <PagingControls />
    </>
  );
}

export default QuestionsTable;

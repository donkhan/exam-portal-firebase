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

      <td>{q.chapter}</td>

      <td>{q.difficulty || <em>NA</em>}</td>

      <td>{q.question_type}</td>

      <td>{q.marks}</td>

      <td>{q.question_text}</td>

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
        {Array.isArray(q.correct_answer)
          ? q.correct_answer.join(", ")
          : q.correct_answer || <em>N/A</em>}
      </td>

      <td>
        <button>Edit</button>
        <hr />
        <button
          onClick={() => deleteSingleQuestion(q.id)}
          style={{ color: "red" }}
        >
          Delete
        </button>
      </td>
    </tr>
  ))}
</tbody>

      </table>
    </>
  );
}

export default QuestionsTable;

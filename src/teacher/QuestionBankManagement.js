import { useEffect, useState, useRef } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "./../firebase";
import { stripJsonComments } from "../utils/jsonutils";
import QuestionUploadPanel from "./QuestionUploadPanel";
import QuestionsTable from "./QuestionsTable";
import QuestionsDownload from "./QuestionsDownload";
import QuestionsDeleteAll from "./QuestionsDeleteAll";
import { useQuestionEdit } from "./useQuestionEdit";

function QuestionBankManagement({ onBack, courseId: fixedCourseId }) {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(fixedCourseId || "");

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const fileInputRef = useRef(null);

  const { editingId, editData, setEditData, startEdit, cancelEdit, saveEdit } =
    useQuestionEdit(setQuestions);

  const [newQuestion, setNewQuestion] = useState({
    chapter: "",
    difficulty: "EASY",
    question_type: "MCQ",
    question_text: "",
    options: { A: "", B: "", C: "", D: "" },
    correct_answer: [],
    marks: 1,
  });

  /* ================= LOAD COURSES ================= */

  useEffect(() => {
    async function loadCourses() {
      const snap = await getDocs(collection(db, "courses"));
      const list = snap.docs.map((doc) => doc.data());
      setCourses(list);
    }

    loadCourses();
  }, []);

  /* ================= LOAD QUESTIONS ================= */

  async function loadQuestions(courseId) {
    setLoading(true);

    const q = query(
      collection(db, "questions"),
      where("course_id", "==", courseId),
    );

    const snap = await getDocs(q);
    const list = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setQuestions(list);
    setLoading(false);
  }

  useEffect(() => {
    if (!selectedCourse) {
      setQuestions([]);
      return;
    }
    loadQuestions(selectedCourse);
  }, [selectedCourse]);

  /* ================= UPLOAD QUESTIONS ================= */

  const uploadQuestionsFromData = async (data) => {
    if (!data.course_id || !Array.isArray(data.questions)) {
      alert("Invalid JSON format");
      return;
    }

    const invalid = data.questions.filter(
      (q) => q.question_type === "NUMERICAL",
    );

    if (invalid.length > 0) {
      setStatus(
        `Upload failed. ${invalid.length} question(s) use invalid type NUMERICAL.`,
      );
      return;
    }

    let count = 0;

    for (const q of data.questions) {
      if (
        !q.chapter ||
        !q.question_type ||
        !q.question_text ||
        !q.marks ||
        !q.correct_answer
      ) {
        alert("Invalid question entry detected");
        setStatus("Failed to read");
        return;
      }

      await addDoc(collection(db, "questions"), {
        course_id: data.course_id,
        question_id: crypto.randomUUID(),
        chapter: q.chapter,
        difficulty: q.difficulty,
        question_type: q.question_type,
        question_text: q.question_text,
        options: q.options || {},
        correct_answer: q.correct_answer || [],
        marks: q.marks,
        created_at: Date.now(),
      });

      count++;
    }

    setStatus(`✅ ${count} questions uploaded successfully`);

    if (selectedCourse === data.course_id) {
      loadQuestions(selectedCourse);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setStatus("Reading file...");
      const text = await file.text();
      const data = JSON.parse(stripJsonComments(text));

      await uploadQuestionsFromData(data);
    } catch (err) {
      console.error(err);
      alert("Error uploading questions " + err);
      setStatus("❌ Upload failed");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const deleteSingleQuestion = async (questionId) => {
    const ok = window.confirm(
      "Are you sure you want to DELETE this question?\n\nThis cannot be undone.",
    );

    if (!ok) return;

    try {
      await deleteDoc(doc(db, "questions", questionId));

      // Update UI without full reload
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete question");
    }
  };

  const saveNewQuestion = async () => {
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
        options: newQuestion.question_type === "MCQ" ? newQuestion.options : {},
        correct_answer: newQuestion.correct_answer,
        marks: newQuestion.marks,
        created_at: Date.now(),
      });

      setShowAddForm(false);

      setNewQuestion({
        chapter: "",
        difficulty: "EASY",
        question_type: "MCQ",
        question_text: "",
        options: { A: "", B: "", C: "", D: "" },
        correct_answer: [],
        marks: 1,
      });

      loadQuestions(selectedCourse);
    } catch (err) {
      console.error(err);
      alert("Failed to add question");
    }
  };

  const handleJsonQuestions = async (questions) => {
    console.log("Imported questions:", questions);

    const data = {
      course_id: selectedCourse, // or force user to choose
      questions: questions,
    };

    try {
      setStatus("Uploading pasted questions...");
      await uploadQuestionsFromData(data);
    } catch (err) {
      console.error(err);
      alert("Error uploading pasted questions");
    }
  };

  /* ================= UI ================= */

  return (
    <div style={{ padding: "20px" }}>
      <h3>Question Bank</h3>

      <button onClick={onBack}>← Back</button>

      <hr />

      <button onClick={() => setShowAddForm(true)}>➕ Add Question</button>

      {showAddForm && (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "6px",
            padding: "16px",
            marginBottom: "20px",
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
                setNewQuestion({ ...newQuestion, chapter: e.target.value })
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

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "80px",
              }}
            >
              <label style={{ fontSize: "12px", color: "#555" }}>Marks</label>
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
              />
            </div>
          </div>

          {/* QUESTION TEXT */}
          <textarea
            placeholder="Question text"
            rows="3"
            style={{
              width: "100%",
              marginBottom: "10px",
            }}
            value={newQuestion.question_text}
            onChange={(e) =>
              setNewQuestion({ ...newQuestion, question_text: e.target.value })
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
            <button onClick={() => setShowAddForm(false)}>Cancel</button>

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

      <hr />
      {/* COURSE SELECT */}

      {selectedCourse && (
        <div style={{ marginBottom: "15px", display: "flex", gap: "10px" }}>
          <QuestionsDownload
            selectedCourse={selectedCourse}
            questions={questions}
          />

          <QuestionsDeleteAll
            selectedCourse={selectedCourse}
            onAfterDelete={() => {
              setQuestions([]);
              setStatus("❌ All questions deleted");
            }}
          />
        </div>
      )}

      <QuestionUploadPanel
        onFileUpload={handleFileUpload}
        fileInputRef={fileInputRef}
        status={status}
        onJsonQuestions={handleJsonQuestions}
      />

      <QuestionsTable
        loading={loading}
        questions={questions}
        editingId={editingId}
        editData={editData}
        setEditData={setEditData}
        startEdit={startEdit}
        cancelEdit={cancelEdit}
        saveEdit={saveEdit}
        deleteSingleQuestion={deleteSingleQuestion}
      />
    </div>
  );
}

export default QuestionBankManagement;

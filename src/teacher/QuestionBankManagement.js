import { useEffect, useState, useRef } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  doc,
} from "firebase/firestore";
import { db } from "./../firebase";
import { stripJsonComments } from "../utils/jsonutils";
import QuestionUploadPanel from "./QuestionUploadPanel";
import QuestionsTable from "./QuestionsTable";
import QuestionsDownload from "./QuestionsDownload";
import QuestionsDeleteAll from "./QuestionsDeleteAll";
import { useQuestionEdit } from "./useQuestionEdit";
import { useQuestionDelete } from "./useQuestionDelete";
import SingleQuestionAdd from "./SingleQuestionAdd";

function QuestionBankManagement({ onBack, courseId: fixedCourseId }) {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(fixedCourseId || "");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const fileInputRef = useRef(null);

  const { editingId, editData, setEditData, startEdit, cancelEdit, saveEdit } =
    useQuestionEdit(setQuestions);
  const { deleteSingleQuestion } = useQuestionDelete(setQuestions);


  
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

      <SingleQuestionAdd
        selectedCourse={selectedCourse}
        onAfterAdd={() => loadQuestions(selectedCourse)}
      />

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

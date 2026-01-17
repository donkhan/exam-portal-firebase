import { useEffect, useState, useRef } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./../firebase";
import QuestionUploadPanel from "./QuestionUploadPanel";
import QuestionsTable from "./../components/QuestionsTable";
import QuestionsDownload from "./QuestionsDownload";
import QuestionsDeleteAll from "./QuestionsDeleteAll";
import { useQuestionEdit } from "./useQuestionEdit";
import { useQuestionDelete } from "./useQuestionDelete";
import { useQuestions } from "./useQuestions";
import { handleQuestionFileUpload } from "./questionUpload/fileUploadHandler";
import { handlePastedQuestions } from "./questionUpload/jsonPasteHandler";
import { uploadQuestionsFromData } from "./questionUpload/uploadQuestionsFromData";

function QuestionBankManagement({
  onBack,
  courseId: fixedCourseId,
  courseName,
  onCreateExam, // ✅ ADDED
}) {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(fixedCourseId || "");
  const [status, setStatus] = useState("");
  const fileInputRef = useRef(null);
  const { questions, loading, setQuestions, loadQuestions } = useQuestions();
  const { deleteSingleQuestion } = useQuestionDelete(setQuestions);
  const [jsonText, setJsonText] = useState("");

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

  useEffect(() => {
    loadQuestions(selectedCourse);
  }, [selectedCourse]);

  /* ================= UPLOAD QUESTIONS ================= */

  const handleFileUpload = async (e) => {
    const text = await handleQuestionFileUpload({
      event: e,
      setStatus,
      fileInputRef,
    });
    if (text) {
      setJsonText(text);
    }
  };

  const handleJsonQuestions = async (questions) => {
    const success = await handlePastedQuestions({
      questions,
      selectedCourse,
      uploadQuestionsFromData,
      setStatus,
    });
    if (success) {
      loadQuestions(selectedCourse);
    }
  };

  /* ================= UI ================= */

  return (
    <div style={{ padding: "20px" }}>
      <h3>Question Bank</h3>

      <button onClick={onBack}>← Back</button>

      <br />

      {/* 🔹 COURSE HEADER + CREATE EXAM */}
      <div
        style={{
          marginTop: "10px",
          marginBottom: "15px",
          padding: "8px 12px",
          background: "#f4f6f8",
          border: "1px solid #dce3ea",
          borderRadius: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <strong>Course:</strong> {courseName}
        </div>

        <button
          onClick={() => onCreateExam(fixedCourseId, courseName)}
          disabled={!questions || questions.length === 0}
        >
          Create Exam
        </button>
      </div>

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
        jsonText={jsonText}
      />

      <QuestionsTable selectedCourseId={selectedCourse} />
    </div>
  );
}

export default QuestionBankManagement;

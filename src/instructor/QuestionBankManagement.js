import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";

import { db } from "./../firebase";
import QuestionUploadPanel from "./QuestionUploadPanel";
import QuestionsTable from "./../components/QuestionsTable";
import QuestionsDownload from "./QuestionsDownload";
import QuestionsDeleteAll from "./QuestionsDeleteAll";

import { useQuestionDelete } from "./useQuestionDelete";
import { useQuestions } from "./useQuestions";

import { handleQuestionFileUpload } from "./questionUpload/fileUploadHandler";
import { handlePastedQuestions } from "./questionUpload/jsonPasteHandler";
import { uploadQuestionsFromData } from "./questionUpload/uploadQuestionsFromData";

function QuestionBankManagement() {
  const { courseId } = useParams();              // ✅ ROUTE PARAM
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [courseName, setCourseName] = useState("");
  const [status, setStatus] = useState("");
  const [jsonText, setJsonText] = useState("");

  const fileInputRef = useRef(null);

  const {
    questions,
    loading,
    setQuestions,
    loadQuestions,
  } = useQuestions();

  const { deleteSingleQuestion } = useQuestionDelete(setQuestions);

  /* ================= LOAD COURSE INFO ================= */

  useEffect(() => {
    async function loadCourseInfo() {
      if (!courseId) return;

      const snap = await getDocs(collection(db, "courses"));
      const list = snap.docs.map((doc) => doc.data());
      setCourses(list);

      const found = list.find((c) => c.course_id === courseId);
      if (found) {
        setCourseName(found.course_name || found.name || courseId);
      }
    }

    loadCourseInfo();
  }, [courseId]);

  /* ================= LOAD QUESTIONS ================= */

  useEffect(() => {
    if (courseId) {
      loadQuestions(courseId);
    }
  }, [courseId]);

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
      selectedCourse: courseId,
      uploadQuestionsFromData,
      setStatus,
    });
    if (success) {
      loadQuestions(courseId);
    }
  };

  /* ================= GUARD ================= */

  if (!courseId) {
    return (
      <div style={{ padding: "20px" }}>
        <p>Invalid course.</p>
        <button onClick={() => navigate("/instructor/manage-courses")}>
          ⬅ Back to Courses
        </button>
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div style={{ padding: "20px" }}>
      <h3>Question Bank</h3>

      <button onClick={() => navigate("/instructor/manage-courses")}>
        ← Back
      </button>

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
          <strong>Course:</strong> {courseName || courseId}
        </div>

        <button
          onClick={() =>
            navigate(`/instructor/exams?courseId=${courseId}`)
          }
          disabled={!questions || questions.length === 0}
        >
          Create Exam
        </button>
      </div>

      {courseId && (
        <div style={{ marginBottom: "15px", display: "flex", gap: "10px" }}>
          <QuestionsDownload
            selectedCourse={courseId}
            questions={questions}
          />

          <QuestionsDeleteAll
            selectedCourse={courseId}
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

      <QuestionsTable selectedCourseId={courseId} />
    </div>
  );
}

export default QuestionBankManagement;

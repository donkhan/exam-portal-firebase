import { Routes, Route, Navigate } from "react-router-dom";

/* ===== DASHBOARD ===== */
import InstructorApp from "../instructor/InstructorApp";

/* ===== COURSE MANAGEMENT ===== */
import ManageCourses from "../instructor/ManageCourses";
import SanitizeQuestions from "../instructor/SanitizeQuestions";
import QuestionBankManagement from "../instructor/QuestionBankManagement";

/* ===== EXAM MANAGEMENT ===== */
import ExamManagement from "../instructor/ExamManagement";
import ExamResults from "../instructor/ExamResults";

/* ===== SHARED / PREVIEW ===== */
import ExamApplication from "../student/ExamApplication";

function InstructorRoutes() {
  return (
    <Routes>
      {/* ================= DASHBOARD ================= */}
      <Route path="/" element={<InstructorApp />} />

      {/* ================= COURSES ================= */}
      <Route path="manage-courses" element={<ManageCourses />} />

      <Route
        path="courses/:courseId/questions"
        element={<QuestionBankManagement />}
      />

      <Route
        path="courses/:courseId/sanitize"
        element={<SanitizeQuestions />}
      />

      {/* ================= EXAMS ================= */}
      <Route path="exams" element={<ExamManagement />} />
      <Route path="results" element={<ExamResults />} />

      {/* ================= PREVIEW ================= */}
      <Route path="exam/:examId" element={<ExamApplication />} />

      {/* ================= FALLBACK ================= */}
      <Route path="*" element={<Navigate to="/instructor" replace />} />
    </Routes>
  );
}

export default InstructorRoutes;

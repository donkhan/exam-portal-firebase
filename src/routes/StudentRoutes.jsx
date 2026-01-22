import { Routes, Route, Navigate } from "react-router-dom";

/* ===== STUDENT FLOW ===== */
import ExamEntry from "../student/ExamEntry";
import ExamApplication from "../student/ExamApplication";

function StudentRoutes() {
  return (
    <Routes>
      <Route path="exam-entry" element={<ExamEntry />} />
      <Route path="exam/:examId" element={<ExamApplication />} />

      {/* ================= FALLBACK ================= */}
      <Route
        path="*"
        element={<Navigate to="/student/exam-entry" replace />}
      />
    </Routes>
  );
}

export default StudentRoutes;

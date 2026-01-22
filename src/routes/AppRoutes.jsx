import { Routes, Route, Navigate } from "react-router-dom";
import { isInstructor } from "../utils/isInstructor";

/* ===== COMMON ===== */
import HomePage from "../HomePage";

/* ===== DOMAIN ROUTES ===== */
import StudentRoutes from "./StudentRoutes";
import InstructorRoutes from "./InstructorRoutes";

function AppRoutes({ user }) {
  const instructor = isInstructor(user);

  return (
    <Routes>
      {/* ================= HOME ================= */}
      <Route path="/" element={<HomePage />} />

      {/* ================= STUDENT ================= */}
      <Route path="/student/*" element={<StudentRoutes />} />

      {/* ================= INSTRUCTOR ================= */}
      <Route
        path="/instructor/*"
        element={
          instructor ? (
            <InstructorRoutes />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* ================= FALLBACK ================= */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;

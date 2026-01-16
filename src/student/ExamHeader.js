import React from "react";
import ExamInstructions from "./ExamInstructions";

const ExamHeader = ({
  user,
  exam,
  activeExamId,
  courseName,
  onLogout,
  showInstructions,
  setShowInstructions,
  onJoinExam,
}) => {
  if (!user || !exam) return null;

  const renderStatus = () => {
    if (exam.status === "IN_PROGRESS") return "In Progress";
    if (exam.status === "SUBMITTED") return "Submitted";
    if (exam.status === "EVALUATED") return "Evaluated";
    return "";
  };

  return (
    <>
      <div className="exam-header">
        {/* LEFT */}
        <div className="exam-header-left">
          <div className="student-name">{user.displayName}</div>
          <div className="student-email">{user.email}</div>
        </div>

        {/* CENTER */}
        <div className="exam-header-center">
          <div className="meta-item">
            <strong>Exam ID:</strong> {activeExamId}
          </div>
          <div className="meta-item">
            <strong>Course:</strong> {courseName}
          </div>
          <div className="meta-item">
            <strong>Status:</strong>{" "}
            <span className={`status-badge ${exam.status.toLowerCase()}`}>
              {renderStatus()}
            </span>
          </div>
        </div>

        {/* RIGHT */}
        <div className="exam-header-right">
          <button
            className="btn-secondary"
            onClick={() => setShowInstructions(true)}
          >
            ⓘ Instructions
          </button>
          <button className="btn-danger" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* INSTRUCTIONS MODAL */}
      {showInstructions && (
        <div className="modal-backdrop">
          <div className="modal">
            <ExamInstructions
              showClose
              onProceed={() => {
                setShowInstructions(false);
                onJoinExam();
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ExamHeader;

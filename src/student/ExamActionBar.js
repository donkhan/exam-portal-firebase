import React from "react";
import { formatMMSS } from "../utils/time";

const ExamActionBar = ({
  exam,
  currentIndex,
  totalQuestions,
  canSubmit,
  submitting,
  submitUnlockInSec,
  onSubmitClick,
}) => {
  if (!exam || exam.submitted) return null;

  const isLastQuestion = currentIndex === totalQuestions - 1;

  if (!isLastQuestion) return null;

  return (
    <div className="exam-action-bar">
      <button
        disabled={submitting || !canSubmit}
        onClick={onSubmitClick}
        style={{
          opacity: canSubmit ? 1 : 0.6,
          cursor: canSubmit ? "pointer" : "not-allowed",
        }}
      >
        Submit Exam
      </button>

      {!canSubmit && (
        <p className="submit-lock-info">
          Submit available in{" "}
          <strong>{formatMMSS(submitUnlockInSec)}</strong>
        </p>
      )}
    </div>
  );
};

export default ExamActionBar;

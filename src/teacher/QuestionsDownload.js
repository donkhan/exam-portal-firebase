import React from "react";

/**
 * QuestionsDownload
 * ------------------
 * Handles:
 * - Preparing export JSON
 * - Triggering browser download
 * - UI button
 */
function QuestionsDownload({ selectedCourse, questions }) {
  const downloadQuestions = () => {
    if (!selectedCourse) {
      alert("Please select a course first");
      return;
    }

    if (!questions || questions.length === 0) {
      alert("No questions to download for this course");
      return;
    }

    const exportData = {
      course_id: selectedCourse,
      questions: questions.map((q) => {
        // Remove Firestore-only fields
        const { id, created_at, ...rest } = q;
        return rest;
      }),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `questions_${selectedCourse}.json`;
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={downloadQuestions}
      disabled={!selectedCourse || questions.length === 0}
      style={{
        background: "#1976d2",
        color: "white",
        padding: "8px 12px",
        border: "none",
        cursor:
          !selectedCourse || questions.length === 0
            ? "not-allowed"
            : "pointer",
        opacity: !selectedCourse || questions.length === 0 ? 0.6 : 1,
      }}
    >
      ⬇️ Download Questions (JSON)
    </button>
  );
}

export default QuestionsDownload;

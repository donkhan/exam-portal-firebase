import React from "react";
import JsonPasteUpload from "./JsonPasteUpload";

function QuestionUploadPanel({
  onFileUpload,
  fileInputRef,
  status,
  onJsonQuestions,
}) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <strong>Upload Questions (JSON):</strong>
      <br />

      <input
        type="file"
        accept=".json"
        onChange={onFileUpload}
        ref={fileInputRef}
      />

      {status && <p>{status}</p>}

      <JsonPasteUpload onQuestionsReady={onJsonQuestions} />
    </div>
  );
}

export default QuestionUploadPanel;

import React from "react";

const ExamResult = ({ exam }) => {
  if (!exam || exam.status !== "EVALUATED") return null;

  return (
    <div className="success">
      <br />
      <h3>Result</h3>

      <p>
        <strong>Score:</strong> {exam.score} / {exam.max_score}
      </p>

      <p>
        Correct: {exam.result_summary.correct}
        <br />
        Wrong: {exam.result_summary.wrong}
        <br />
        Unanswered: {exam.result_summary.unanswered}
      </p>

      <br />

      <h4>Question-wise Result</h4>

      {exam.question_results.map((res, i) => (
        <div key={i}>
          <strong>Question {i + 1}:</strong>{" "}
          {res.is_correct ? "✅ Correct" : "❌ Wrong"}
          <br />
          Marks Awarded: {res.marks_awarded}
          <br />
          <br />
        </div>
      ))}
    </div>
  );
};

export default ExamResult;

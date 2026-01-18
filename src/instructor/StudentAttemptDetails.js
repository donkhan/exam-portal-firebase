import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { formatDateTime,formatDuration } from "../utils/time";

export default function StudentAttemptDetails({ attempt, onBack }) {
  const { questions = [], answers = {}, question_results = [] } = attempt;
  const totalMarksAwarded = question_results.reduce(
    (sum, r) => sum + (r?.marks_awarded ?? 0),
    0,
  );

  const totalPossibleMarks = questions.reduce(
    (sum, q) => sum + (q?.marks ?? 0),
    0,
  );

  const handleDeleteAttempt = async () => {
    const ok = window.confirm(
      "This will permanently delete this student attempt.\n\n" +
        "Make sure you have downloaded the result PDF.\n\n" +
        "This action cannot be undone.",
    );

    if (!ok) return;

    try {
      await deleteDoc(doc(db, "exams", attempt.id));
      alert("Student attempt deleted successfully.");
      onBack(); // go back to list
    } catch (err) {
      console.error("Failed to delete attempt:", err);
      alert("Failed to delete attempt. Please try again.");
    }
  };

  const renderStars = (value, max = 5) => {
    if (value == null) return "—";

    return (
      <span>
        {[...Array(max)].map((_, i) => (
          <span key={i} style={{ color: i < value ? "#f5b301" : "#ccc" }}>
            ★
          </span>
        ))}
      </span>
    );
  };

  return (
    <div style={{ marginTop: 20 }}>
      <button onClick={onBack}>← Back</button>

      <button
        onClick={handleDeleteAttempt}
        style={{
          background: "#ffeaea",
          border: "1px solid #ff9a9a",
          color: "#a40000",
          cursor: "pointer",
        }}
      >
        Delete Attempt
      </button>

      <h3 style={{ marginTop: 10 }}>
        {attempt.user_name} ({attempt.user_email})
      </h3>

      
      <button onClick={() => window.print()}>Download PDF</button>
      <div
        style={{
          marginTop: 10,
          marginBottom: 15,
          padding: "10px 14px",
          background: "#f6fff2",
          border: "1px solid #cdecc1",
          borderRadius: 6,
          fontSize: 16,
          fontWeight: "bold",
        }}
      >
        Total Marks: {totalMarksAwarded} / {totalPossibleMarks}
      </div>

      <table
        border="1"
        cellPadding="8"
        style={{ borderCollapse: "collapse", width: "100%" }}
      >
        <thead style={{ background: "#f0f0f0" }}>
          <tr>
            <th>#</th>
            <th>Question</th>
            <th>Difficulty</th>
            <th>Student Answer</th>
            <th>Correct Answer</th>
            <th>Result</th>
            <th>Marks</th>
            <th>Marks Awarded</th>
          </tr>
        </thead>

        <tbody>
          {questions.map((q, i) => {
            const studentAnswer = answers[i];
            const result = question_results[i];

            return (
              <tr key={q.id}>
                <td>{i + 1}</td>
                <td>{q.question_text}</td>
                <td>{q.difficulty}</td>
                <td>{studentAnswer ?? "-"}</td>
                <td>{result?.correct_answer ?? "-"}</td>
                <td>{result?.is_correct ? "✔ Correct" : "✘ Wrong"}</td>
                <td>{q.marks ?? "-"}</td>
                <td>{result?.marks_awarded ?? 0}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div
  style={{
    marginTop: 12,
    marginBottom: 16,
    padding: "10px 14px",
    border: "1px solid #d6e4ff",
    background: "#f5f8ff",
    borderRadius: 6,
    fontSize: 14,
  }}
>
  <strong>⏱ Exam Timing</strong>

  <div style={{ marginTop: 6 }}>
    <div>Start Time: <strong>{formatDateTime(attempt.started_at)}</strong></div>
    <br></br>
    <div>End Time: <strong>{formatDateTime(attempt.submitted_at)}</strong></div>
    <br></br>
    <div>
      Duration: 
      <strong>
  {formatDuration(Math.floor((attempt.submitted_at - attempt.started_at) / 1000))}
</strong>

    </div>
  </div>
</div>
    

      {attempt.feedback ? (
        <div
          style={{
            marginTop: 10,
            marginBottom: 15,
            padding: "12px 14px",
            border: "1px solid #ddd",
            borderRadius: 6,
            background: "#fafafa",
          }}
        >
          <h4 style={{ marginTop: 0 }}>📝 Student Feedback</h4>

          <p>
            <strong>Overall Rating:</strong>{" "}
            {renderStars(attempt.feedback.rating)}{" "}
            <span style={{ color: "#666" }}>({attempt.feedback.rating}/5)</span>
          </p>

          <p>
            <strong>Difficulty:</strong> {attempt.feedback.difficulty || "—"}
          </p>

          <p>
            <strong>Question Clarity:</strong>{" "}
            {renderStars(attempt.feedback.clarity)}{" "}
            <span style={{ color: "#666" }}>
              ({attempt.feedback.clarity}/5)
            </span>
          </p>

          {attempt.feedback.comments && (
            <p>
              <strong>Comments:</strong>
              <br />
              <span style={{ whiteSpace: "pre-wrap" }}>
                {attempt.feedback.comments}
              </span>
            </p>
          )}
        </div>
      ) : (
        <div
          style={{
            marginTop: 10,
            marginBottom: 15,
            padding: "10px 12px",
            borderLeft: "4px solid #ccc",
            color: "#666",
            fontStyle: "italic",
          }}
        >
          Student skipped feedback.
        </div>
      )}

    </div>
  );
}

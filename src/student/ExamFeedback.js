import { useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

function ExamFeedback({ exam, user, onDone }) {
  const [rating, setRating] = useState(null);
  const [difficulty, setDifficulty] = useState("");
  const [clarity, setClarity] = useState(null);
  const [comments, setComments] = useState("");
  const [saving, setSaving] = useState(false);

  if (!exam || !user) return null;

  const submitFeedback = async (skip = false) => {
    if (saving) return;
    setSaving(true);

    try {
      await updateDoc(
        doc(db, "exams", `${exam.exam_id}_${user.uid}`),
        {
          feedback: {
            rating: skip ? null : rating,
            difficulty: skip ? null : difficulty || null,
            clarity: skip ? null : clarity,
            comments: skip ? null : comments || null,
            submittedAt: serverTimestamp(),
          }
        }
      );

      onDone?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="feedback-container">
      <h3>📝 Exam Feedback</h3>
      <p className="feedback-subtext">
        Your exam has been submitted. Please share your experience.
      </p>

      {/* ===== Overall Rating ===== */}
      <div className="feedback-field">
        <label>
  Overall Experience
  <span style={{ fontWeight: "normal", fontSize: "12px", color: "#666" }}>
    {" "} (1 = Worst, 5 = Excellent)
  </span>
</label>

        <div className="rating-row">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              className={`rating-btn ${rating === n ? "selected" : ""}`}
              onClick={() => setRating(n)}
              type="button"
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* ===== Difficulty ===== */}
      <div className="feedback-field">
        <label>Difficulty</label>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          <option value="">Select</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
      </div>

      {/* ===== Clarity ===== */}
      <div className="feedback-field">
        <label>
  Question Clarity
  <span style={{ fontWeight: "normal", fontSize: "12px", color: "#666" }}>
    {" "} (1 = Worst, 5 = Excellent)
  </span>
</label>

        <div className="rating-row">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              className={`rating-btn ${clarity === n ? "selected" : ""}`}
              onClick={() => setClarity(n)}
              type="button"
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* ===== Comments ===== */}
      <div className="feedback-field">
        <label>Comments (optional)</label>
        <textarea
          rows={4}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Say anything — even harsh feedback helps improve the exam."
        />
      </div>

          <br></br>
      {/* ===== Actions ===== */}
      <div className="feedback-actions">
        <button
          disabled={saving}
          onClick={() => submitFeedback(false)}
        >
          Submit Feedback
        </button>

        <button
          disabled={saving}
          className="secondary"
          onClick={() => submitFeedback(true)}
        >
          Skip
        </button>
      </div>
    </div>
  );
}

export default ExamFeedback;

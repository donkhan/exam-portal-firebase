const ExamQuestionPanel = ({
  exam,
  q,
  currentIndex,
  answers,
  timeLeft,

  onPrev,
  onNext,
  onJump,

  onSelectMCQ,
  onToggleMSQ,
  onUpdateFill,
}) => {
  if (!exam || !q) return null;

  return (
    <>
      {/* TIMER */}
      {!exam.submitted && timeLeft !== null && (
        <p>
          Time Left: {Math.floor(timeLeft / 60)}:
          {String(timeLeft % 60).padStart(2, "0")}
        </p>
      )}

      {/* QUESTION */}
      <h3>
        Q{currentIndex + 1}. {q.question_text}
      </h3>

      {/* ANSWER INPUTS */}
      {q.question_type === "MCQ" &&
        Object.entries(q.options).map(([k, v]) => (
          <label key={k} className="mcq-option">
            <input
              type="radio"
              name={`q-${currentIndex}`}
              checked={answers[currentIndex]?.[0] === k}
              onChange={() => onSelectMCQ(k)}
            />
            <span className="option-key">{k}.</span>
            <span className="option-text">{v}</span>
          </label>
        ))}

      {q.question_type === "MSQ" &&
        Object.entries(q.options).map(([k, v]) => (
          <label key={k}>
            <input
              type="checkbox"
              checked={(answers[currentIndex] || []).includes(k)}
              onChange={() => onToggleMSQ(k)}
            />
            {k}. {v}
          </label>
        ))}

      {q.question_type === "FILL_BLANK" && (
        <input
          value={answers[currentIndex] || ""}
          onChange={(e) => onUpdateFill(e.target.value)}
        />
      )}

      <br />
      <br />

      {/* NAVIGATION ONLY */}
      <div className="question-nav">
        <button disabled={currentIndex === 0} onClick={onPrev}>
          Prev
        </button>

        <button
          disabled={currentIndex === exam.questions.length - 1}
          onClick={onNext}
        >
          Next
        </button>

        <select
          value={currentIndex}
          disabled={exam.submitted}
          onChange={(e) => onJump(Number(e.target.value))}
          className="question-jump"
        >
          {exam.questions.map((_, i) => (
            <option key={i} value={i}>
              Q{i + 1}
            </option>
          ))}
        </select>
      </div>
    </>
  );
};

export default ExamQuestionPanel;

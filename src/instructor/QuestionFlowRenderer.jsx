import React, { useEffect, useRef } from "react";

function QuestionFlowRenderer({
  current,
  index,
  total,
  answer,
  bufferLength,
  checkingAI,
  onAnswerChange,
  onNext,
  onSkip,
  onRunAICheck,
  onBack,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [current, index]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onNext();
    }
  };

  if (!current) {
    return (
      <>
        <h3>Reached end of questions</h3>

        <button disabled={checkingAI} onClick={onRunAICheck}>
          {checkingAI ? "🤖 Checking with AI…" : "🤖 Check with AI"} (
          {bufferLength})
        </button>

        <div style={{ marginTop: "16px" }}>
          <button onClick={onBack}>⬅ Back</button>
        </div>
      </>
    );
  }

  return (
    <>
      <button onClick={onBack}>⬅ Back</button>

      <h3>
        Question {index + 1} of {total}
      </h3>

      <p style={{ marginTop: "10px", fontWeight: "500" }}>
        {current.question_text}
      </p>

      <input
        ref={inputRef}
        type="text"
        value={answer}
        onChange={(e) => onAnswerChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter answer"
        style={{ width: "100%", maxWidth: "320px", marginTop: "8px" }}
      />

      <div style={{ marginTop: "16px" }}>
        <button onClick={onNext}>▶ Next</button>

        <button style={{ marginLeft: "8px" }} onClick={onSkip}>
          ⏭ Skip
        </button>

        <button
          style={{ marginLeft: "10px" }}
          disabled={checkingAI}
          onClick={onRunAICheck}
        >
          {checkingAI ? "🤖 Checking with AI…" : "🤖 Check with AI"} (
          {bufferLength})
        </button>
      </div>
    </>
  );
}

export default QuestionFlowRenderer;

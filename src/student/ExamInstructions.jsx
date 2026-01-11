// ExamInstructions.jsx

export default function ExamInstructions({ onProceed, showClose = false  }) {
  return (
    <div className="instructions-container">
      <h3>General Instructions</h3>

      <ul>
        <li>The duration of the test is fixed.</li>
        <li>The timer starts once you proceed.</li>
        <li>The exam cannot be paused.</li>
        <li>You can logout and login whenever you want as long as exam is removed by admin.</li>
        <li>The exam will auto-submit when time expires.</li>
        <li>Only one active attempt is allowed.</li>
        <li>Mobile devices may affect usability.</li>
        <li>Improper Fractions are not allowed. if the answer is 17/2 you need to write as 8 1/2</li>
        <li>Fractions should be written in reduced form. If the answer is 15/25 then the answer is 3/5</li>
        <li>Leave Fractions as it is. Do not convert into decimals unless explicitly asked in the question</li>
      </ul>

      {showClose ? (
  <button onClick={onProceed}>Close</button>
) : (
  <button onClick={onProceed}>Proceed to Exam</button>
)}

    </div>
  );
}

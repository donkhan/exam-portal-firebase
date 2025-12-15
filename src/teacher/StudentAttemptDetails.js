export default function StudentAttemptDetails({ attempt, onBack }) {
  return (
    <div>
      <button onClick={onBack}>← Back</button>
      <h3>{attempt.user_email}</h3>

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>#</th>
            <th>Question</th>
            <th>Difficulty</th>
            <th>Student Answer</th>
            <th>Correct Answer</th>
          </tr>
        </thead>
        <tbody>
          {attempt.questions.map((q, i) => {
            const studentAns = attempt.answers?.[i];

            return (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{q.question_text}</td>
                <td>{q.difficulty}</td>
                <td>{formatAnswer(studentAns)}</td>
                <td>{formatAnswer(q.correct_answer)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function formatAnswer(ans) {
  if (Array.isArray(ans)) return ans.join(", ");
  if (ans === undefined) return "-";
  return ans.toString();
}

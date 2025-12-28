export default function StudentAttemptDetails({ attempt, onBack }) {
  const { questions = [], answers = {}, question_results = [] } = attempt;

  return (
    <div style={{ marginTop: 20 }}>
      <button onClick={onBack}>← Back</button>

      <h3 style={{ marginTop: 10 }}>
        {attempt.user_name} ({attempt.user_email})
      </h3>

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
                <td>
                  {result?.is_correct ? "✔ Correct" : "✘ Wrong"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

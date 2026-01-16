import ExamInstructions from "./ExamInstructions";

const ExamHeader = ({
  user,
  exam,
  activeExamId,
  courseName,
  onLogout,
  showInstructions,
  setShowInstructions,
  onJoinExam,
}) => {
  if (!user) return null;

  return (
    <>
      <div className="exam-header">
        <div className="exam-header-left">
          <div className="student-name">{user.displayName}</div>
          <div className="student-email">{user.email}</div>
        </div>

        <div className="exam-header-center">
          {exam && (
            <>
              <span><strong>Exam ID:</strong> {activeExamId}</span>
              <span><strong>Course:</strong> {courseName}</span>
              <span><strong>Status:</strong> {exam.status}</span>
            </>
          )}
        </div>

        <div className="exam-header-right">
          <button onClick={() => setShowInstructions(true)}>
            ⓘ Instructions
          </button>
          <button onClick={onLogout}>Logout</button>
        </div>
      </div>

      {showInstructions && (
        <div className="modal-backdrop">
          <div className="modal">
            <ExamInstructions
              showClose
              onProceed={() => {
                setShowInstructions(false);
                onJoinExam();
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ExamHeader;

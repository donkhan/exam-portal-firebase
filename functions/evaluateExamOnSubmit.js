/* eslint-disable */
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

const db = admin.firestore();

exports.evaluateExamOnSubmit = onDocumentUpdated(
  "exams/{examId}",
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();

    /* ========= GUARDS ========= */

    if (!before || !after) return;

    // 🔑 Explicit evaluation trigger
    if (before.evaluate_request_id === after.evaluate_request_id) return;

    // Prevent double evaluation
    if (after.status === "EVALUATED") return;

    console.log("Evaluating attempt:", event.params.examId);

    const answers = after.answers;
    const questions = after.questions;
    const courseId = after.course_id;

    if (!answers || !questions || !courseId) {
      console.log("Missing answers/questions/courseId");
      return;
    }

    /* ========= FETCH CORRECT ANSWERS ========= */

    const qSnap = await db
      .collection("questions")
      .where("course_id", "==", courseId)
      .get();

    const answerMap = {};
    qSnap.docs.forEach((doc) => {
      answerMap[doc.id] = doc.data();
    });

    /* ========= EVALUATION ========= */

    let score = 0;
    let maxScore = 0;
    let correct = 0;
    let wrong = 0;
    let unanswered = 0;

    const questionResults = [];

    questions.forEach((q, index) => {
      const studentAnswer = answers[index];
      const correctAnswer = answerMap[q.id]?.correct_answer;
      const marks = q.marks || 1;

      maxScore += marks;

      let isCorrect = false;
      let isEvaluated = true;

      const hasCorrectAnswer =
        correctAnswer !== undefined &&
        correctAnswer !== null &&
        !(Array.isArray(correctAnswer) && correctAnswer.length === 0) &&
        String(correctAnswer).trim() !== "";

      if (!hasCorrectAnswer) {
        isEvaluated = false;
      } else if (studentAnswer === undefined) {
        unanswered++;
      } else if (q.question_type === "MCQ") {
        if (
          Array.isArray(studentAnswer) &&
          correctAnswer.includes(studentAnswer[0])
        ) {
          isCorrect = true;
        }
      } else if (q.question_type === "MSQ") {
        const c = new Set(correctAnswer);
        const s = new Set(studentAnswer || []);
        if (c.size === s.size && [...c].every((x) => s.has(x))) {
          isCorrect = true;
        }
      } else if (q.question_type === "FILL_BLANK") {
        if (
          String(studentAnswer).trim().toLowerCase() ===
          String(correctAnswer).trim().toLowerCase()
        ) {
          isCorrect = true;
        }
      }

      if (isEvaluated) {
        if (isCorrect) {
          score += marks;
          correct++;
        } else if (studentAnswer !== undefined) {
          wrong++;
        }
      }

      questionResults.push({
        question_id: q.id,
        is_correct: isEvaluated ? isCorrect : null,
        marks_awarded: isEvaluated && isCorrect ? marks : 0,
        correct_answer: hasCorrectAnswer ? correctAnswer : null,
        evaluated: isEvaluated,
      });
    });

    /* ========= WRITE RESULT ========= */

    await event.data.after.ref.update({
      status: "EVALUATED",
      score,
      max_score: maxScore,
      evaluated_at: Date.now(),
      result_summary: {
        correct,
        wrong,
        unanswered,
      },
      question_results: questionResults,
    });

    console.log("Evaluation completed:", event.params.examId);
  }
);

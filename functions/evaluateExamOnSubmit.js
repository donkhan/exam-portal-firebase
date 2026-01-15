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
    if (before.submitted === true) return;
    if (after.submitted !== true) return;
    if (after.status === "EVALUATED") return;

    console.log("Evaluating exam:", event.params.examId);

    const answers = after.answers;
    const questions = after.questions;
    const courseId = after.course_id;

    if (!answers || !questions || !courseId) return;

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

      if (studentAnswer === undefined) {
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

      if (isCorrect) {
        score += marks;
        correct++;
      } else if (studentAnswer !== undefined) {
        wrong++;
      }

      questionResults.push({
        question_id: q.id,
        is_correct: isCorrect,
        marks_awarded: isCorrect ? marks : 0,
        correct_answer: correctAnswer,
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

    console.log("Evaluation completed");
  }
);

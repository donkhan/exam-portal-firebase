/* eslint-disable */
const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

exports.triggerExamEvaluation = onCall(async (request) => {
  const { examId } = request.data;

  if (!examId) {
    throw new Error("examId is required");
  }

  const db = admin.firestore();
  const ref = db.collection("exams").doc(examId);

  // 🔥 Explicit trigger
  await ref.update({
    evaluate_request_id: Date.now(),
  });

  return {
    ok: true,
    message: "Evaluation triggered",
  };
});

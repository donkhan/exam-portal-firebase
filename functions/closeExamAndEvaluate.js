/* eslint-disable */
const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

const db = admin.firestore();
const TEACHER_EMAIL = "kamil.k@cmr.edu.in";

exports.closeExamAndEvaluate = onCall(async (request) => {
  const auth = request.auth;
  const { examId } = request.data;

  if (!auth || auth.token.email !== TEACHER_EMAIL) {
    throw new Error("Permission denied");
  }

  if (!examId) {
    throw new Error("examId is required");
  }

  const snap = await db
    .collection("exams")
    .where("exam_id", "==", examId)
    .get();

  if (snap.empty) {
    return { message: "No attempts found", closed: 0 };
  }

  const batch = db.batch();
  let closedCount = 0;

  snap.docs.forEach((doc) => {
    const data = doc.data();
    if (data.submitted === true) return;

    batch.update(doc.ref, {
      submitted: true,
      auto_submitted: true,
      status: "SUBMITTED",
      submitted_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    closedCount++;
  });

  if (closedCount === 0) {
    return { message: "No in-progress attempts", closed: 0 };
  }

  await batch.commit();

  return {
    message: "Exam closed and evaluation triggered",
    closed: closedCount,
  };
});

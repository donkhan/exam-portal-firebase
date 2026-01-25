/* eslint-disable */
const admin = require("firebase-admin");
admin.initializeApp();

/* ===== EXISTING FUNCTIONS (UNCHANGED) ===== */

exports.evaluateExamOnSubmit =
  require("./evaluateExamOnSubmit").evaluateExamOnSubmit;

exports.closeExamAndEvaluate =
  require("./closeExamAndEvaluate").closeExamAndEvaluate;

exports.triggerExamEvaluation =
  require("./triggerExamEvaluation").triggerExamEvaluation;


/* ===== NEW AI FUNCTION (v2 STYLE) ===== */

const {onRequest} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");

const checkAnswersWithAIHandler =
  require("./ai/checkAnswersWithAI");

const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

exports.checkAnswersWithAI = onRequest(
  {
    region: "us-central1",
    secrets: [OPENAI_API_KEY],
  },
  checkAnswersWithAIHandler,
);

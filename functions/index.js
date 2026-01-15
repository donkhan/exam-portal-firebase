/* eslint-disable */
const admin = require("firebase-admin");

admin.initializeApp();

exports.evaluateExamOnSubmit =
  require("./evaluateExamOnSubmit").evaluateExamOnSubmit;

exports.closeExamAndEvaluate =
  require("./closeExamAndEvaluate").closeExamAndEvaluate;
